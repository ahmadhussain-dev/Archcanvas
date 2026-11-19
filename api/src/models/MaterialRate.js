import mongoose from 'mongoose'

export const MATERIAL_KEYS = ['steel', 'cement', 'bricks', 'sand', 'crush', 'labour', 'pipes']
export const RATE_STATUSES = ['unverified', 'verified']
// Where a price came from: the built-in starting value, an admin override, the
// daily online check, or the automatic city price (lib/localPrices.js).
export const RATE_ORIGINS = ['seed', 'admin', 'auto', 'estimate']
export const STALE_AFTER_DAYS = 30

const historySchema = new mongoose.Schema(
  {
    ratePkr: { type: Number, required: true, min: 0 },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    origin: { type: String, enum: RATE_ORIGINS }
  },
  { _id: false }
)

const sourceSchema = new mongoose.Schema(
  {
    origin: { type: String, enum: RATE_ORIGINS, default: 'seed' },
    name: { type: String, trim: true, maxlength: 80 },
    url: { type: String, trim: true, maxlength: 300 },
    // The city whose listed price this one uses, or 'Pakistan average'.
    basedOn: { type: String, trim: true, maxlength: 60 },
    // For automatic city prices: the region and how far the market nudged it.
    region: { type: String, trim: true, maxlength: 40 },
    market: { type: Number }
  },
  { _id: false }
)

// Grey structure material prices, one per material per city, all kept up to
// date by the daily check: cement and steel from websites, the rest worked out
// for the city. An admin price on /admin/prices is an optional override.
const materialRateSchema = new mongoose.Schema(
  {
    key: { type: String, enum: MATERIAL_KEYS, required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    unit: { type: String, required: true, trim: true, maxlength: 30 },
    ratePkr: { type: Number, required: true, min: 0 },
    city: { type: String, default: 'Faisalabad', trim: true, maxlength: 60 },
    status: { type: String, enum: RATE_STATUSES, default: 'unverified' },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: sourceSchema, default: () => ({ origin: 'seed' }) },
    history: { type: [historySchema], default: [] },
    // An online price that jumped a lot overnight waits here; the next check
    // accepts it if the site still shows about the same price.
    pending: { ratePkr: { type: Number }, at: { type: Date } }
  },
  { timestamps: true }
)

materialRateSchema.index({ key: 1, city: 1 }, { unique: true })

// What the UI shows: green = verified (online or admin), blue = estimated for
// the city automatically, amber = older than 30 days, grey = unverified.
materialRateSchema.virtual('displayStatus').get(function () {
  if (this.status !== 'verified' || !this.verifiedAt) return 'unverified'
  const ageDays = (Date.now() - this.verifiedAt.getTime()) / 86_400_000
  if (ageDays > STALE_AFTER_DAYS) return 'stale'
  return this.source?.origin === 'estimate' ? 'estimated' : 'verified'
})

materialRateSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  }
})

export default mongoose.models.MaterialRate ?? mongoose.model('MaterialRate', materialRateSchema)

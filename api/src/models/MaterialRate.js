import mongoose from 'mongoose'

export const MATERIAL_KEYS = ['steel', 'cement', 'bricks', 'sand', 'crush', 'labour', 'pipes']
export const RATE_STATUSES = ['unverified', 'verified']
// Where a price came from: the built-in starting value, an admin, or the daily online check.
export const RATE_ORIGINS = ['seed', 'admin', 'auto']
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
    basedOn: { type: String, trim: true, maxlength: 60 }
  },
  { _id: false }
)

// Grey structure material prices, one per material per city. Cement and steel
// are refreshed by the daily online check; admins edit the rest on /admin/prices.
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
    history: { type: [historySchema], default: [] }
  },
  { timestamps: true }
)

materialRateSchema.index({ key: 1, city: 1 }, { unique: true })

// What the UI shows: grey = unverified, green = verified, amber = stale.
materialRateSchema.virtual('displayStatus').get(function () {
  if (this.status !== 'verified' || !this.verifiedAt) return 'unverified'
  const ageDays = (Date.now() - this.verifiedAt.getTime()) / 86_400_000
  return ageDays > STALE_AFTER_DAYS ? 'stale' : 'verified'
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

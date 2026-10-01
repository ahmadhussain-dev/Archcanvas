import mongoose from 'mongoose'

export const MATERIAL_KEYS = ['steel', 'cement', 'bricks', 'sand', 'crush', 'labour', 'pipes']
export const RATE_STATUSES = ['unverified', 'verified']
export const STALE_AFTER_DAYS = 30

const historySchema = new mongoose.Schema(
  {
    ratePkr: { type: Number, required: true, min: 0 },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
)

// Grey structure material prices, edited by admins on /admin/prices.
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

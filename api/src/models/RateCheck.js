import mongoose from 'mongoose'

// One run of the daily online price check, shown to admins on /admin/prices.
const resultSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    source: { type: String },
    url: { type: String },
    ok: { type: Boolean, required: true },
    message: { type: String, maxlength: 300 },
    // Cities whose price changed, stayed the same, or was held back as a suspicious jump.
    changed: { type: Number, default: 0 },
    unchanged: { type: Number, default: 0 },
    held: { type: [String], default: [] }
  },
  { _id: false }
)

const rateCheckSchema = new mongoose.Schema(
  {
    trigger: { type: String, enum: ['schedule', 'admin', 'script'], default: 'schedule' },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date },
    results: { type: [resultSchema], default: [] }
  },
  { timestamps: false }
)

rateCheckSchema.index({ startedAt: -1 })

rateCheckSchema.set('toJSON', {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  }
})

export default mongoose.models.RateCheck ?? mongoose.model('RateCheck', rateCheckSchema)

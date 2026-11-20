import mongoose from 'mongoose'
import { ADJUSTMENT_LIMITS, REGION_KEYS } from '../lib/cityAdjustments.js'

// An admin's percentage for one region, replacing the default in
// lib/cityAdjustments.js. No row means the default is used.
const regionAdjustmentSchema = new mongoose.Schema(
  {
    region: { type: String, enum: REGION_KEYS, required: true, unique: true },
    pct: { type: Number, required: true, min: ADJUSTMENT_LIMITS.min, max: ADJUSTMENT_LIMITS.max },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

regionAdjustmentSchema.set('toJSON', {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  }
})

export default mongoose.models.RegionAdjustment ?? mongoose.model('RegionAdjustment', regionAdjustmentSchema)

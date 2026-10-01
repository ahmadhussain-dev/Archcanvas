import mongoose from 'mongoose'
import { SQFT_PER_MARLA } from '../lib/units.js'

const plotSchema = new mongoose.Schema(
  {
    // Preset key such as "5-marla", or "custom" when the user typed their own size.
    preset: { type: String, default: 'custom', trim: true, maxlength: 20 },
    widthFt: { type: Number, required: true, min: 5, max: 500 },
    depthFt: { type: Number, required: true, min: 5, max: 500 }
  },
  { _id: false }
)

plotSchema.virtual('areaSqft').get(function () {
  return Math.round(this.widthFt * this.depthFt * 100) / 100
})
plotSchema.virtual('areaMarla').get(function () {
  return Math.round((this.widthFt * this.depthFt * 100) / SQFT_PER_MARLA) / 100
})

plotSchema.set('toJSON', { virtuals: true })

// Optional answers from the requirements step. Empty means "plot border only".
const requirementsSchema = new mongoose.Schema(
  {
    bedrooms: { type: Number, min: 0, max: 12 },
    bathrooms: { type: Number, min: 0, max: 12 },
    kitchens: { type: Number, min: 0, max: 4 },
    carPorch: { type: Boolean },
    drawingRoom: { type: Boolean },
    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { _id: false }
)

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, default: 'Faisalabad', trim: true, maxlength: 60 },
    plot: { type: plotSchema, required: true },
    floors: { type: Number, default: 1, min: 1, max: 5 },
    roofHeightFt: { type: Number, default: 10.5, min: 7, max: 20 },
    requirements: { type: requirementsSchema, default: undefined },
    // Latest saved version. Older versions stay in ProjectVersion for undo/history.
    currentVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectVersion' },
    versionCount: { type: Number, default: 0, min: 0 },
    thumbnail: { type: String, maxlength: 300000 } // small data URL of the plan
  },
  { timestamps: true }
)

projectSchema.index({ owner: 1, updatedAt: -1 })

projectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  }
})

export default mongoose.models.Project ?? mongoose.model('Project', projectSchema)

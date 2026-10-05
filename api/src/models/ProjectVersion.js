import mongoose from 'mongoose'

export const VERSION_SOURCES = ['manual', 'autosave', 'ai', 'template', 'restore']

// One saved state of a project's plan. The floorplan is the engine's
// building file JSON (engine/src, stringifyBuildingFile/loadBuildingFile).
const projectVersionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    number: { type: Number, required: true, min: 1 },
    source: { type: String, enum: VERSION_SOURCES, default: 'manual' },
    note: { type: String, trim: true, maxlength: 200 },
    floorplan: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  // updatedAt moves when a newer autosave replaces an autosave draft.
  { timestamps: true }
)

projectVersionSchema.index({ project: 1, number: -1 }, { unique: true })

projectVersionSchema.set('toJSON', {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  }
})

export default mongoose.models.ProjectVersion ?? mongoose.model('ProjectVersion', projectVersionSchema)

import { Schema, model, models } from "mongoose";

const RagSchema = new Schema({
  rag: {
    type: String,
    required: true,
    unique: true,
  },
  systemMessage: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false, // This is optional, change to `required: true` if it must be provided
  },
  emailEnable: {
    type: Boolean,
    default: false, // Default value is false, change as per your requirement
  },
  apiKey: {
    type: String,
    required: false, // This is optional, change to `required: true` if it must be provided
  },
  esculateExp: {
    type: String,
    required: false, // This is optional, change to `required: true` if it must be provided
  },
});

const Rag = models.Rag || model("Rag", RagSchema);
export default Rag;

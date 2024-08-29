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
});

const Rag = models.Rag || model("Rag", RagSchema);
export default Rag;

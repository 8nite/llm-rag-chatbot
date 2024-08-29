import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const Message = models.Message || model("Message", MessageSchema);
export default Message;

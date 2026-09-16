import { classifyTicket, recommendSolutions } from '../services/aiService.js';

export const classifyTicketHandler = async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await classifyTicket(title, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recommendSolutionsHandler = async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await recommendSolutions(title, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

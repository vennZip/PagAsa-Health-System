import Service from "../models/Service.js";

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ serviceName: 1 });
    return res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve services." });
  }
};

export const createService = async (req, res) => {
  try {
    const { serviceName, description, category, requirements, availability } = req.body;
    if (typeof serviceName !== "string" || !serviceName.trim() || !category) return res.status(400).json({ success: false, message: "Service name and category are required." });
    const service = await Service.create({ serviceName: serviceName.trim(), description, category, availability, requirements: Array.isArray(requirements) ? requirements : [] });
    return res.status(201).json({ success: true, message: "Service created successfully.", data: service });
  } catch (error) {
    return res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? "A service with this name already exists." : "Check the service details and try again." });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName, description, category, requirements, availability } = req.body;
    if (serviceName !== undefined && (typeof serviceName !== "string" || !serviceName.trim())) return res.status(400).json({ success: false, message: "Service name cannot be empty." });
    const service = await Service.findByIdAndUpdate(id, { serviceName, description, category, requirements, availability }, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: "Service not found." });
    return res.status(200).json({ success: true, message: "Service updated successfully.", data: service });
  } catch (error) {
    return res.status(error?.code === 11000 ? 409 : 400).json({ success: false, message: error?.code === 11000 ? "A service with this name already exists." : "Check the service details and try again." });
  }
};

// GET: Retrieve all available health center services
export const getAvailableServices = async (req, res) => {
  try {
    const services = await Service.find({
      availability: "available"
    }).sort({ serviceName: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error("Get services error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve available services."
    });
  }
};

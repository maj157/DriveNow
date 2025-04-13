const db = require("../firebase");
const Invoice = require("../models/Invoice");
const Booking = require("../models/Booking");
const Car = require("../models/car");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Get all invoices with filtering, sorting, and pagination
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getAllInvoices = async (req, res) => {
  try {
    // Only admin users should be able to see all invoices
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view all invoices",
      });
    }

    const {
      userId,
      bookingId,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sort = "createdAt:desc",
      page = 1,
      limit = 10,
    } = req.query;

    let query = db.collection("invoices");

    // Apply filters
    if (userId) query = query.where("userId", "==", userId);
    if (bookingId) query = query.where("bookingId", "==", bookingId);
    if (status) query = query.where("status", "==", status);

    // Execute query
    const snapshot = await query.get();
    const invoices = [];
    snapshot.forEach((doc) => {
      invoices.push({ id: doc.id, ...doc.data() });
    });

    // Filter results in memory (Firestore limitations)
    let filteredInvoices = invoices;
    if (startDate || endDate) {
      filteredInvoices = filteredInvoices.filter((invoice) => {
        const createdAt = new Date(invoice.createdAt);
        if (startDate && createdAt < new Date(startDate)) return false;
        if (endDate && createdAt > new Date(endDate)) return false;
        return true;
      });
    }

    // Continue with pagination and response...
    // ...existing code...
  } catch (error) {
    console.error("Error in getAllInvoices:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching invoices",
      error: error.message,
    });
  }
};

/**
 * Get invoice by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check if user is authorized to view the invoice
    if (
      !req.user.isAdmin &&
      req.user._id.toString() !== invoice.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this invoice",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error in getInvoiceById:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the invoice",
      error: error.message,
    });
  }
};

/**
 * Get invoices for a specific user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getUserInvoices = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is authorized to view these invoices
    if (!req.user.isAdmin && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view these invoices",
      });
    }

    // Parse query parameters for filtering and pagination
    const {
      status,
      startDate,
      endDate,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = { userId: userId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Build sort object
    const sortOptions = {};
    if (sort) {
      const sortFields = sort.split(",");
      sortFields.forEach((field) => {
        if (field.startsWith("-")) {
          sortOptions[field.substring(1)] = -1;
        } else {
          sortOptions[field] = 1;
        }
      });
    } else {
      // Default sort by newest first
      sortOptions.createdAt = -1;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const invoices = await Invoice.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Get total count for pagination
    const total = await Invoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        invoices,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error in getUserInvoices:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user invoices",
      error: error.message,
    });
  }
};

/**
 * Get invoice for a specific booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getBookingInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const invoice = await Invoice.findByBookingId(bookingId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found for this booking",
      });
    }

    // Check if user is authorized to view the invoice
    if (
      !req.user.isAdmin &&
      req.user._id.toString() !== invoice.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this invoice",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error in getBookingInvoice:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the booking invoice",
      error: error.message,
    });
  }
};

/**
 * Create a new invoice
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.createInvoice = async (req, res) => {
  try {
    // Only admin users should be able to create invoices
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create invoices",
      });
    }

    const { bookingId } = req.body;

    // Check if an invoice already exists for this booking
    const existingInvoice = await Invoice.findByBookingId(bookingId);
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "An invoice already exists for this booking",
      });
    }

    // Get the booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get the vehicle details
    const car = await Car.findById(booking.vehicleId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Calculate rental duration in days
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calculate rental cost
    const rentalCost = car.dailyRate * durationDays;

    // Calculate additional costs from booking options
    let additionalCosts = 0;
    const lineItems = [
      {
        description: `${car.make} ${car.model} (${
          car.year
        }) - ${durationDays} day${durationDays > 1 ? "s" : ""}`,
        quantity: durationDays,
        unitPrice: car.dailyRate,
        amount: rentalCost,
      },
    ];

    // Add options as line items
    if (booking.options) {
      if (booking.options.insurance) {
        const insuranceCost = booking.options.insurance.price * durationDays;
        additionalCosts += insuranceCost;
        lineItems.push({
          description: `Insurance: ${booking.options.insurance.type}`,
          quantity: durationDays,
          unitPrice: booking.options.insurance.price,
          amount: insuranceCost,
        });
      }

      if (booking.options.additionalDrivers > 0) {
        const additionalDriversCost =
          booking.options.additionalDrivers * 10 * durationDays; // Assuming $10 per additional driver per day
        additionalCosts += additionalDriversCost;
        lineItems.push({
          description: `Additional Drivers (${booking.options.additionalDrivers})`,
          quantity: booking.options.additionalDrivers * durationDays,
          unitPrice: 10,
          amount: additionalDriversCost,
        });
      }

      // Add other options as needed
      if (booking.options.childSeat) {
        const childSeatCost = 5 * durationDays; // Assuming $5 per day
        additionalCosts += childSeatCost;
        lineItems.push({
          description: "Child Seat",
          quantity: durationDays,
          unitPrice: 5,
          amount: childSeatCost,
        });
      }

      if (booking.options.gps) {
        const gpsCost = 8 * durationDays; // Assuming $8 per day
        additionalCosts += gpsCost;
        lineItems.push({
          description: "GPS Navigation",
          quantity: durationDays,
          unitPrice: 8,
          amount: gpsCost,
        });
      }
    }

    // Calculate subtotal
    const subtotal = rentalCost + additionalCosts;

    // Calculate tax (assuming 15% tax rate)
    const taxRate = 0.15;
    const taxAmount = subtotal * taxRate;

    // Calculate total amount
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomStr}`;

    // Set due date (14 days from today)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create the invoice
    const invoice = {
      invoiceNumber,
      userId: booking.userId,
      bookingId: booking._id,
      car: {
        id: car._id,
        make: car.make,
        model: car.model,
        year: car.year,
        licensePlate: car.licensePlate,
      },
      rentalPeriod: {
        startDate: booking.startDate,
        endDate: booking.endDate,
        duration: durationDays,
      },
      lineItems,
      subtotal,
      taxAmount,
      taxRate,
      totalAmount,
      status: "issued",
      dueDate,
      paymentStatus: "pending",
    };

    const savedInvoice = await Invoice.create(invoice);

    return res.status(201).json({
      success: true,
      data: savedInvoice,
    });
  } catch (error) {
    console.error("Error in createInvoice:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the invoice",
      error: error.message,
    });
  }
};

/**
 * Update an invoice
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateInvoice = async (req, res) => {
  try {
    // Only admin users should be able to update invoices
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update invoices",
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Find the invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Prevent updating certain fields
    const restrictedFields = [
      "invoiceNumber",
      "userId",
      "bookingId",
      "createdAt",
    ];
    restrictedFields.forEach((field) => {
      if (updateData[field]) {
        delete updateData[field];
      }
    });

    // Update the invoice
    const updatedInvoice = await Invoice.updateInvoice(id, updateData);

    return res.status(200).json({
      success: true,
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("Error in updateInvoice:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the invoice",
      error: error.message,
    });
  }
};

/**
 * Delete an invoice
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.deleteInvoice = async (req, res) => {
  try {
    // Only admin users should be able to delete invoices
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete invoices",
      });
    }

    const { id } = req.params;

    // Find the invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Delete the invoice
    await Invoice.deleteInvoice(id);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteInvoice:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the invoice",
      error: error.message,
    });
  }
};

/**
 * Generate a PDF for an invoice
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check if user is authorized to access this invoice
    if (
      !req.user.isAdmin &&
      req.user._id.toString() !== invoice.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this invoice",
      });
    }

    // Get user details
    const user = await User.findById(invoice.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add company logo (if available)
    // doc.image('path/to/logo.png', 50, 45, { width: 150 });

    // Add document title
    doc.fontSize(20).text("DriveNow Car Rental", { align: "center" });
    doc.fontSize(16).text("INVOICE", { align: "center" });
    doc.moveDown();

    // Add invoice information
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    doc.moveDown();

    // Add customer information
    doc.fontSize(14).text("Customer Information");
    doc.fontSize(12).text(`Name: ${user.firstName} ${user.lastName}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phone || "N/A"}`);
    doc.moveDown();

    // Add vehicle information
    doc.fontSize(14).text("Car Information");
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .text(
        `Make/Model: ${invoice.car.make} ${invoice.car.model} (${invoice.car.year})`
      );
    doc.text(`License Plate: ${invoice.car.licensePlate}`);
    doc.moveDown();

    // Add rental period information
    doc.fontSize(14).text("Rental Period");
    doc
      .fontSize(12)
      .text(
        `Start Date: ${new Date(
          invoice.rentalPeriod.startDate
        ).toLocaleDateString()}`
      );
    doc.text(
      `End Date: ${new Date(invoice.rentalPeriod.endDate).toLocaleDateString()}`
    );
    doc.text(
      `Duration: ${invoice.rentalPeriod.duration} day${
        invoice.rentalPeriod.duration > 1 ? "s" : ""
      }`
    );
    doc.moveDown();

    // Add line items
    doc.fontSize(14).text("Charges");

    // Create a table for line items
    let y = doc.y + 10;
    doc.fontSize(10);

    // Table headers
    doc.font("Helvetica-Bold");
    doc.text("Description", 50, y);
    doc.text("Quantity", 300, y, { width: 50, align: "right" });
    doc.text("Unit Price", 370, y, { width: 80, align: "right" });
    doc.text("Amount", 470, y, { width: 80, align: "right" });
    doc
      .moveTo(50, y + 15)
      .lineTo(550, y + 15)
      .stroke();
    doc.font("Helvetica");
    y += 25;

    // Table rows
    invoice.lineItems.forEach((item) => {
      doc.text(item.description, 50, y, { width: 240 });
      doc.text(item.quantity.toString(), 300, y, { width: 50, align: "right" });
      doc.text(`$${item.unitPrice.toFixed(2)}`, 370, y, {
        width: 80,
        align: "right",
      });
      doc.text(`$${item.amount.toFixed(2)}`, 470, y, {
        width: 80,
        align: "right",
      });
      y += 20;
    });

    // Add a line
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Add subtotal, tax, and total
    doc.text("Subtotal:", 350, y, { width: 100, align: "right" });
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 470, y, {
      width: 80,
      align: "right",
    });
    y += 20;

    doc.text(`Tax (${(invoice.taxRate * 100).toFixed(0)}%):`, 350, y, {
      width: 100,
      align: "right",
    });
    doc.text(`$${invoice.taxAmount.toFixed(2)}`, 470, y, {
      width: 80,
      align: "right",
    });
    y += 20;

    doc.font("Helvetica-Bold");
    doc.text("Total:", 350, y, { width: 100, align: "right" });
    doc.text(`$${invoice.totalAmount.toFixed(2)}`, 470, y, {
      width: 80,
      align: "right",
    });
    doc.font("Helvetica");
    y += 30;

    // Add payment information
    doc.fontSize(14).text("Payment Information", 50, y);
    doc
      .fontSize(12)
      .text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`);

    if (invoice.paymentMethod) {
      doc.text(
        `Payment Method: ${invoice.paymentMethod
          .replace("_", " ")
          .toUpperCase()}`
      );
    }

    if (invoice.paymentDate) {
      doc.text(
        `Payment Date: ${new Date(invoice.paymentDate).toLocaleDateString()}`
      );
    }

    doc.moveDown();

    // Add footer
    doc
      .fontSize(10)
      .text("Thank you for choosing DriveNow Car Rental!", { align: "center" });
    doc.text(
      "For any questions regarding this invoice, please contact support@drivenow.com",
      { align: "center" }
    );

    // Finalize the PDF
    doc.end();

    // Update invoice download count and last downloaded date
    await Invoice.updateInvoice(id, {
      lastDownloaded: new Date(),
      downloadCount: (invoice.downloadCount || 0) + 1,
    });
  } catch (error) {
    console.error("Error in generateInvoicePDF:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating the invoice PDF",
      error: error.message,
    });
  }
};

/**
 * Get statistics about invoices (for admin)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getInvoiceStats = async (req, res) => {
  try {
    // Only admin users should be able to view invoice statistics
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view invoice statistics",
      });
    }

    // Get total number of invoices
    const totalInvoices = await Invoice.countDocuments();

    // Get counts by status
    const statusCounts = await Invoice.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get counts by payment status
    const paymentStatusCounts = await Invoice.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    // Get total revenue
    const totalRevenueResult = await Invoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Get average invoice amount
    const averageAmountResult = await Invoice.aggregate([
      { $group: { _id: null, average: { $avg: "$totalAmount" } } },
    ]);
    const averageAmount =
      averageAmountResult.length > 0 ? averageAmountResult[0].average : 0;

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: "paid",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    // Format monthly revenue for easier consumption
    const formattedMonthlyRevenue = monthlyRevenue.map((item) => {
      const year = item._id.year;
      const month = item._id.month;
      const date = new Date(year, month - 1, 1);

      return {
        month: date.toLocaleString("default", { month: "long" }),
        year,
        revenue: item.revenue,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        paymentStatusCounts: paymentStatusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        totalRevenue,
        averageAmount,
        monthlyRevenue: formattedMonthlyRevenue,
      },
    });
  } catch (error) {
    console.error("Error in getInvoiceStats:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching invoice statistics",
      error: error.message,
    });
  }
};

/**
 * Mark an invoice as paid
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.markInvoiceAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentDetails } = req.body;

    // Find the invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check if user is authorized to update this invoice
    if (
      !req.user.isAdmin &&
      req.user._id.toString() !== invoice.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this invoice",
      });
    }

    // Check if invoice is already paid
    if (invoice.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already paid",
      });
    }

    // Validate payment method
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    // Mark invoice as paid
    const paymentData = {
      method: paymentMethod,
      details: paymentDetails || {},
    };

    const updatedInvoice = await Invoice.markAsPaid(id, paymentData);

    return res.status(200).json({
      success: true,
      data: updatedInvoice,
    });
  } catch (error) {
    console.error("Error in markInvoiceAsPaid:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while marking the invoice as paid",
      error: error.message,
    });
  }
};

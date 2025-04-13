const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { authenticate, isAdmin } = require("../middleware/auth");

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices (admin only)
 * @access  Admin
 */
router.get("/", authenticate, isAdmin, invoiceController.getAllInvoices);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private (owner or admin)
 */
router.get("/:id", authenticate, invoiceController.getInvoiceById);

/**
 * @route   GET /api/invoices/user/:userId
 * @desc    Get all invoices for a specific user
 * @access  Private (owner or admin)
 */
router.get(
  "/user/:userId",
  authenticate,
  invoiceController.getUserInvoices
);

/**
 * @route   GET /api/invoices/booking/:bookingId
 * @desc    Get invoice for a specific booking
 * @access  Private (owner or admin)
 */
router.get(
  "/booking/:bookingId",
  authenticate,
  invoiceController.getBookingInvoice
);

/**
 * @route   GET /api/invoices/:id/pdf
 * @desc    Generate and download invoice PDF
 * @access  Private (owner or admin)
 */
router.get(
  "/:id/pdf",
  authenticate,
  invoiceController.generateInvoicePDF
);

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice
 * @access  Admin
 */
router.post(
  "/",
  authenticate,
  isAdmin,
  invoiceController.createInvoice
);

/**
 * @route   PUT /api/invoices/:id
 * @desc    Update an invoice
 * @access  Admin
 */
router.put(
  "/:id",
  authenticate,
  isAdmin,
  invoiceController.updateInvoice
);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete an invoice
 * @access  Admin
 */
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  invoiceController.deleteInvoice
);

/**
 * @route   PATCH /api/invoices/:id/pay
 * @desc    Mark invoice as paid
 * @access  Private (owner or admin)
 */
router.patch(
  "/:id/pay",
  authenticate,
  invoiceController.markInvoiceAsPaid
);

/**
 * @route   GET /api/invoices/stats
 * @desc    Get invoice statistics
 * @access  Admin
 */
router.get(
  "/stats",
  authenticate,
  isAdmin,
  invoiceController.getInvoiceStats
);

module.exports = router; 
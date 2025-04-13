const db = require("../firebase");

// Reference to the invoices collection
const invoicesCollection = db.collection("invoices");

// Invoice Schema (representation only, not enforced by Firestore)
const invoiceSchema = {
  invoiceNumber: String,
  userId: String,
  bookingId: String,
  car: {
    id: String,
    make: String,
    model: String,
    year: Number,
    licensePlate: String,
  },
  rentalPeriod: {
    startDate: Date,
    endDate: Date,
    duration: Number,
  },
  lineItems: [
    {
      description: String,
      quantity: Number,
      unitPrice: Number,
      amount: Number,
    },
  ],
  subtotal: Number,
  taxAmount: Number,
  taxRate: Number,
  totalAmount: Number,
  status: {
    type: String,
    enum: ["issued", "paid", "overdue", "cancelled"],
    default: "issued",
  },
  dueDate: Date,
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "debit_card", "bank_transfer", "cash", null],
    default: null,
  },
  paymentDetails: Object,
  paymentDate: Date,
  notes: String,
  lastDownloaded: Date,
  downloadCount: Number,
  createdAt: Date,
  updatedAt: Date,
};

/**
 * Create a new invoice
 */
const createInvoice = async (invoiceData) => {
  try {
    const now = new Date();
    const invoice = {
      ...invoiceData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await invoicesCollection.add(invoice);
    return { id: docRef.id, ...invoice };
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

/**
 * Find invoice by ID
 * @param {string} id - Invoice ID
 * @returns {Promise<Object>} Invoice document
 */
const findById = async (id) => {
  try {
    const doc = await invoicesCollection.doc(id).get();
    if (!doc.exists) {
      throw new Error("Invoice not found");
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error finding invoice by ID:", error);
    throw error;
  }
};

/**
 * Update an invoice
 * @param {string} id - Invoice ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated invoice
 */
const updateInvoice = async (id, updateData) => {
  try {
    updateData.updatedAt = new Date();
    await invoicesCollection.doc(id).update(updateData);
    const updatedDoc = await invoicesCollection.doc(id).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};

/**
 * Delete an invoice
 * @param {string} id - Invoice ID
 * @returns {Promise<Object>} Deleted invoice
 */
const deleteInvoice = async (id) => {
  try {
    const doc = await invoicesCollection.doc(id).get();
    if (!doc.exists) {
      throw new Error("Invoice not found");
    }
    await invoicesCollection.doc(id).delete();
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
};

/**
 * Get invoices for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} User invoices
 */
const findByUserId = async (userId, options = {}) => {
  try {
    const querySnapshot = await invoicesCollection
      .where("userId", "==", userId)
      .get();
    const invoices = [];
    querySnapshot.forEach((doc) => {
      invoices.push({ id: doc.id, ...doc.data() });
    });
    return invoices;
  } catch (error) {
    console.error("Error finding invoices by user ID:", error);
    throw error;
  }
};

/**
 * Get invoice for a specific booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking invoice
 */
const findByBookingId = async (bookingId) => {
  try {
    const querySnapshot = await invoicesCollection
      .where("bookingId", "==", bookingId)
      .get();
    if (querySnapshot.empty) {
      throw new Error("Invoice not found");
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error finding invoice by booking ID:", error);
    throw error;
  }
};

/**
 * Mark invoice as paid
 * @param {string} id - Invoice ID
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Updated invoice
 */
const markAsPaid = async (id, paymentData) => {
  try {
    const updateData = {
      status: "paid",
      paymentStatus: "paid",
      paymentMethod: paymentData.method,
      paymentDetails: paymentData.details,
      paymentDate: new Date(),
      updatedAt: new Date(),
    };
    await invoicesCollection.doc(id).update(updateData);
    const updatedDoc = await invoicesCollection.doc(id).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    throw error;
  }
};

/**
 * Calculate overdue invoices and update their status
 * @returns {Promise<number>} Number of invoices updated
 */
const updateOverdueInvoices = async () => {
  try {
    const now = new Date();
    const querySnapshot = await invoicesCollection
      .where("status", "==", "issued")
      .where("dueDate", "<", now)
      .get();
    const batch = db.batch();
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { status: "overdue", updatedAt: now });
    });
    await batch.commit();
    return querySnapshot.size;
  } catch (error) {
    console.error("Error updating overdue invoices:", error);
    throw error;
  }
};

module.exports = {
  invoiceSchema,
  createInvoice,
  findById,
  updateInvoice,
  deleteInvoice,
  findByUserId,
  findByBookingId,
  markAsPaid,
  updateOverdueInvoices,
};

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

/**
 * Generate a PDF invoice for a reservation
 * @param {Object} reservation - The reservation object
 * @param {Object} user - The user who made the reservation
 * @param {Array} cars - Array of cars in the reservation
 * @returns {Promise<string>} - Returns the path to the generated PDF
 */
const generateInvoice = async (reservation, user, cars) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      // Set up the file path
      const invoiceId = `INV-${reservation.id || Date.now()}`;
      const fileName = `${invoiceId}.pdf`;
      const filePath = path.join(__dirname, "..", "invoices", fileName);

      // Ensure invoices directory exists
      const invoicesDir = path.join(__dirname, "..", "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Pipe the PDF to the file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add company logo and header
      doc.fontSize(20).text("DriveNow Car Rental", { align: "center" });
      doc.fontSize(12).text("Invoice", { align: "center" });
      doc.moveDown();

      // Add invoice details
      doc.fontSize(12).text(`Invoice #: ${invoiceId}`, { align: "right" });
      doc
        .fontSize(12)
        .text(`Date: ${moment().format("MMMM DD, YYYY")}`, { align: "right" });
      doc.moveDown();

      // Add customer details
      doc.fontSize(14).text("Customer Information");
      doc.fontSize(10).text(`Name: ${user.name}`);
      doc.fontSize(10).text(`Email: ${user.email}`);
      doc.fontSize(10).text(`Driver: ${reservation.driverName}`);
      doc.fontSize(10).text(`Driver Age: ${reservation.driverAge}`);
      doc.moveDown();

      // Add reservation details
      doc.fontSize(14).text("Reservation Details");
      doc.fontSize(10).text(`Pickup Location: ${reservation.pickupLocation}`);
      doc.fontSize(10).text(`Return Location: ${reservation.dropLocation}`);
      doc
        .fontSize(10)
        .text(
          `Pickup Date: ${moment(reservation.pickupDate).format(
            "MMMM DD, YYYY HH:mm"
          )}`
        );
      doc
        .fontSize(10)
        .text(
          `Return Date: ${moment(reservation.dropDate).format(
            "MMMM DD, YYYY HH:mm"
          )}`
        );
      doc.fontSize(10).text(`Status: ${reservation.status}`);
      doc.moveDown();

      // Add car details
      doc.fontSize(14).text("Vehicle Information");

      // Create a table for car details
      let y = doc.y;
      const carStart = y;
      doc.fontSize(10).text("Vehicle", 50, y);
      doc.fontSize(10).text("Daily Rate", 200, y);
      doc.fontSize(10).text("Days", 300, y);
      doc.fontSize(10).text("Subtotal", 400, y);

      y += 20;

      // Add each car to the table
      let carTotal = 0;
      cars.forEach((car) => {
        const rentalDays =
          moment(reservation.dropDate).diff(
            moment(reservation.pickupDate),
            "days"
          ) || 1;
        const carSubtotal = car.pricePerDay * rentalDays;
        carTotal += carSubtotal;

        doc.fontSize(10).text(`${car.brand} ${car.model}`, 50, y);
        doc.fontSize(10).text(`$${car.pricePerDay.toFixed(2)}`, 200, y);
        doc.fontSize(10).text(`${rentalDays}`, 300, y);
        doc.fontSize(10).text(`$${carSubtotal.toFixed(2)}`, 400, y);

        y += 20;
      });

      // Draw table border
      doc
        .moveTo(50, carStart - 5)
        .lineTo(500, carStart - 5)
        .lineTo(500, y - 5)
        .lineTo(50, y - 5)
        .lineTo(50, carStart - 5)
        .stroke();

      doc.moveDown();
      y += 20;

      // Add services details
      doc.fontSize(14).text("Additional Services", 50, y);
      y += 20;

      // Create a table for services
      const serviceStart = y;
      doc.fontSize(10).text("Service", 50, y);
      doc.fontSize(10).text("Price", 400, y);

      y += 20;

      // Add each service to the table
      let serviceTotal = 0;
      const services = reservation.services || {};

      if (services.chauffeur) {
        doc.fontSize(10).text("Chauffeur", 50, y);
        doc.fontSize(10).text("$50.00", 400, y);
        serviceTotal += 50;
        y += 20;
      }

      if (services.babySeat) {
        doc.fontSize(10).text("Baby Seat", 50, y);
        doc.fontSize(10).text("$15.00", 400, y);
        serviceTotal += 15;
        y += 20;
      }

      if (services.navigator) {
        doc.fontSize(10).text("Satellite Navigator", 50, y);
        doc.fontSize(10).text("$25.00", 400, y);
        serviceTotal += 25;
        y += 20;
      }

      if (services.gps) {
        doc.fontSize(10).text("GPS", 50, y);
        doc.fontSize(10).text("$10.00", 400, y);
        serviceTotal += 10;
        y += 20;
      }

      // Add insurance
      let insurancePrice = 0;
      if (services.insurance === "Full") {
        insurancePrice = 30;
      } else if (services.insurance === "Tires & Windscreen") {
        insurancePrice = 15;
      } else if (services.insurance === "Additional Driver") {
        insurancePrice = 20;
      }

      if (insurancePrice > 0) {
        doc.fontSize(10).text(`Insurance (${services.insurance})`, 50, y);
        doc.fontSize(10).text(`$${insurancePrice.toFixed(2)}`, 400, y);
        serviceTotal += insurancePrice;
        y += 20;
      }

      // Add fuel option
      let fuelPrice = 0;
      if (services.fuelOption === "Prepaid") {
        fuelPrice = 45;
      }

      if (fuelPrice > 0) {
        doc.fontSize(10).text(`Fuel (${services.fuelOption})`, 50, y);
        doc.fontSize(10).text(`$${fuelPrice.toFixed(2)}`, 400, y);
        serviceTotal += fuelPrice;
        y += 20;
      }

      // Draw table border for services
      doc
        .moveTo(50, serviceStart - 5)
        .lineTo(500, serviceStart - 5)
        .lineTo(500, y - 5)
        .lineTo(50, y - 5)
        .lineTo(50, serviceStart - 5)
        .stroke();

      doc.moveDown();
      y += 20;

      // Add discount if applicable
      let discountAmount = 0;
      if (reservation.discount) {
        discountAmount = reservation.discount.amount || 0;
      }

      // Calculate points earned
      const pointsEarned = Math.floor(reservation.totalPrice / 10);

      // Add summary
      doc.fontSize(14).text("Summary", 50, y);
      y += 20;

      doc.fontSize(10).text("Cars Subtotal:", 300, y);
      doc.fontSize(10).text(`$${carTotal.toFixed(2)}`, 450, y);
      y += 15;

      doc.fontSize(10).text("Services Subtotal:", 300, y);
      doc.fontSize(10).text(`$${serviceTotal.toFixed(2)}`, 450, y);
      y += 15;

      if (discountAmount > 0) {
        doc.fontSize(10).text("Discount:", 300, y);
        doc.fontSize(10).text(`-$${discountAmount.toFixed(2)}`, 450, y);
        y += 15;
      }

      // Draw a line before total
      doc.moveTo(300, y).lineTo(500, y).stroke();
      y += 15;

      const totalAmount = carTotal + serviceTotal - discountAmount;

      doc.fontSize(12).text("Total:", 300, y, { bold: true });
      doc
        .fontSize(12)
        .text(`$${totalAmount.toFixed(2)}`, 450, y, { bold: true });
      y += 20;

      doc.fontSize(10).text(`Points Earned: ${pointsEarned}`, 300, y);

      // Add footer
      doc
        .fontSize(10)
        .text("Thank you for choosing DriveNow Car Rental!", 50, 700, {
          align: "center",
        });
      doc
        .fontSize(10)
        .text(
          "For customer support, please contact us at support@drivenow.com",
          50,
          715,
          { align: "center" }
        );

      // Finalize the PDF
      doc.end();

      // When the stream is finished, resolve with the file path
      stream.on("finish", () => {
        resolve({
          filePath,
          fileName,
          invoiceId,
        });
      });

      // Handle errors
      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoice,
};

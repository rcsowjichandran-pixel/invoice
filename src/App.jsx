import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const taxRates = {
  general: 0.18,
  materials: 0.28,
  services: 0.12,
};

const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  description: '',
  quantity: 1,
  price: 0,
  category: 'general',
});

const calculateItemTotal = (quantity, price) => Number(quantity || 0) * Number(price || 0);

const autoDetectCategory = (description = '') => {
  const normalized = description.toLowerCase();

  if (normalized.includes('cement') || normalized.includes('steel')) {
    return 'materials';
  }

  if (normalized.includes('consulting')) {
    return 'services';
  }

  return 'general';
};

function App() {
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { id: 1, description: 'Steel beams', quantity: 2, price: 150, category: 'materials' },
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalGST, setTotalGST] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    const nextSubtotal = invoiceItems.reduce(
      (sum, item) => sum + calculateItemTotal(item.quantity, item.price),
      0,
    );

    const nextGST = invoiceItems.reduce((sum, item) => {
      const rate = taxRates[item.category] || taxRates.general;
      return sum + calculateItemTotal(item.quantity, item.price) * rate;
    }, 0);

    setSubtotal(nextSubtotal);
    setTotalGST(nextGST);
    setGrandTotal(nextSubtotal + nextGST);
  }, [invoiceItems]);

  const handleItemChange = (id, field, value) => {
    setInvoiceItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        if (field === 'description') {
          updatedItem.category = autoDetectCategory(value);
        }

        return updatedItem;
      }),
    );
  };

  const addNewItem = () => {
    setInvoiceItems((currentItems) => [...currentItems, createEmptyItem()]);
  };

  const removeItem = (id) => {
    setInvoiceItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Invoice Generator', 14, 20);
    doc.setFontSize(11);
    doc.text(`Invoice Number: ${invoiceNumber}`, 14, 30);
    doc.text(`Invoice Date: ${invoiceDate}`, 14, 36);
    doc.text(`Client Name: ${clientName}`, 14, 46);
    doc.text(`Client Address: ${clientAddress}`, 14, 52);

    const rows = invoiceItems.map((item) => [
      item.description,
      item.quantity,
      Number(item.price).toFixed(2),
      calculateItemTotal(item.quantity, item.price).toFixed(2),
    ]);

    doc.autoTable({
      head: [['Description', 'Qty', 'Price', 'Total']],
      body: rows,
      startY: 65,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 98, 255] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 14, finalY);
    doc.text(`Total GST: $${totalGST.toFixed(2)}`, 14, finalY + 8);
    doc.text(`Grand Total: $${grandTotal.toFixed(2)}`, 14, finalY + 16);

    doc.save('invoice.pdf');
  };

  return (
    <div className="invoice-app">
      <div className="invoice-container">
        <h1>Invoice Generator</h1>

        <div className="invoice-header">
          <div className="field-group">
            <label htmlFor="invoice-number">Invoice Number</label>
            <input
              id="invoice-number"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="invoice-date">Invoice Date</label>
            <input
              id="invoice-date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>

        <div className="client-section">
          <h2>Client Details</h2>
          <div className="field-group">
            <label htmlFor="client-name">Client Name</label>
            <input
              id="client-name"
              type="text"
              value={clientName}
              placeholder="Enter client name"
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="client-address">Client Address</label>
            <textarea
              id="client-address"
              rows="3"
              value={clientAddress}
              placeholder="Enter client address"
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="items-table-wrap">
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Category</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                    />
                  </td>
                  <td>
                    <div className="category-cell">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                      >
                        {Object.keys(taxRates).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {item.description && autoDetectCategory(item.description) === item.category && (
                        <span className="auto-detected">Auto-detected</span>
                      )}
                    </div>
                  </td>
                  <td>${calculateItemTotal(item.quantity, item.price).toFixed(2)}</td>
                  <td>
                    <button type="button" className="remove-button" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" className="add-item-btn" onClick={addNewItem}>
          Add New Item
        </button>

        <div className="totals-summary">
          <div className="total-row">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <div className="total-row">
            <span>Total GST</span>
            <strong>${totalGST.toFixed(2)}</strong>
          </div>
          <div className="total-row grand-total">
            <span>Grand Total</span>
            <strong>${grandTotal.toFixed(2)}</strong>
          </div>
        </div>

        <div className="invoice-summary">
          <h2>Invoice Summary</h2>
          <p>
            <strong>Invoice Number:</strong> {invoiceNumber}
          </p>
          <p>
            <strong>Invoice Date:</strong> {invoiceDate}
          </p>
          <p>
            <strong>Client Name:</strong> {clientName}
          </p>
          <p>
            <strong>Client Address:</strong> {clientAddress}
          </p>
          <div className="summary-totals">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Total GST: ${totalGST.toFixed(2)}</p>
            <p>Grand Total: ${grandTotal.toFixed(2)}</p>
          </div>
        </div>

        <button type="button" className="pdf-btn" onClick={generatePDF}>
          Export as PDF
        </button>
      </div>
    </div>
  );
}

export default App;

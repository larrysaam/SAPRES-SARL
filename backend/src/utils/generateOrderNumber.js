let lastOrderNumber = 0;

const generateOrderNumber = (prefix) => {
  lastOrderNumber += 1;
  const paddedNumber = String(lastOrderNumber).padStart(4, '0');
  return `${prefix}-${paddedNumber}`;
};

export default generateOrderNumber;
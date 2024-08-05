export const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };
  
  export const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return re.test(password);
  };
  
  export const sanitizeInput = (input) => {
    // Remove any HTML tags and trim whitespace
    return input.replace(/<[^>]*>?/gm, '').trim();
  };
  
  export const validateAmount = (amount) => {
    return !isNaN(amount) && parseFloat(amount) > 0;
  };
  
  export const validateDate = (date) => {
    return !isNaN(Date.parse(date));
  };
  
  export const validateCategory = (category, validCategories) => {
    return validCategories.includes(category);
  };
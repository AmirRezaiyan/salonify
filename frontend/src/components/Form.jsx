import { motion } from 'framer-motion';
import { FieldErrorBox } from './FieldErrorBox';
import '../styles/Form.css';

export const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  name,
  value, 
  onChange,
  error,
  required = false,
  style = {}
}) => {
  return (
    <motion.div
      className="form-group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`form-input ${error ? 'error' : ''}`}
        required={required}
        style={style}
      />
      {error && <FieldErrorBox message={error} />}
    </motion.div>
  );
};

export const Select = ({ 
  label, 
  name,
  options, 
  value, 
  onChange,
  error,
  required = false 
}) => {
  return (
    <motion.div
      className="form-group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`form-select ${error ? 'error' : ''}`}
        required={required}
      >
        <option value="">Select...</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <FieldErrorBox message={error} />}
    </motion.div>
  );
};

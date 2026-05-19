import { Alert, Snackbar } from '@mui/material';
import React from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ActionFeedbackContext = createContext(null);

export const ActionFeedbackProvider = ({ children }) => {
  const [message, setMessage] = useState('');

  const unavailable = useCallback((reason) => {
    setMessage(`Action is unavailable because ${reason}`);
  }, []);

  const value = useMemo(() => ({ unavailable }), [unavailable]);

  return (
    <ActionFeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={4200}
        open={Boolean(message)}
        onClose={() => setMessage('')}
      >
        <Alert severity="info" variant="filled" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
    </ActionFeedbackContext.Provider>
  );
};

export const useActionFeedback = () => {
  const context = useContext(ActionFeedbackContext);
  if (!context) {
    throw new Error('useActionFeedback must be used within ActionFeedbackProvider');
  }
  return context;
};

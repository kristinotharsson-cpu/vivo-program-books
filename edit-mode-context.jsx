import { createContext, useContext } from 'react';

const EditModeContext = createContext(false);

const useEditMode = () => useContext(EditModeContext);

export { EditModeContext, useEditMode };

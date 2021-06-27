/* eslint-disable no-unused-vars */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  SyntheticEvent,
} from 'react';
import { AnyObjectSchema } from 'yup';

export interface LowFormFormState {
  submitCount: number;
  isFormInvalid: boolean;
  isFormDirty: boolean;
  formValues?: Record<string, any>;
  fieldErrors?: Record<string, any>;
}

export interface UseLowFormHookReturn {
  registerElement: (key: string) => (event: SyntheticEvent) => void;
  handleFormSubmit: (event: SyntheticEvent) => Promise<void>;
  getFormState: () => LowFormFormState;
}

export interface UseLowFormOptions {
  submitCallback: (formData: Record<string, any>) => void | Promise<void>;
  formStateCallback?: (formState: LowFormFormState) => void | Promise<void>;
  schema?: AnyObjectSchema;
  previousSubmits?: number;
}

export const validateSubmission = async (
  formValues: Record<string, any>,
  schema: AnyObjectSchema,
) => {
  const getErrorAtField = async (field: string, value: any) => {
    try {
      await schema.validateAt(field, value);
      return null;
    } catch (error) {
      if (error.name === 'ValidationError') {
        return error.errors[0];
      }
      return null;
    }
  };
  const formKeys = Object.keys(formValues);
  const errorMessages = await Promise
    .all(formKeys.map((field) => getErrorAtField(field, formValues)));
  const isFormInvalid = errorMessages.some((error) => Boolean(error));
  const fieldErrors = formKeys.reduce<Record<string, any>>((acc, curr: string, index) => {
    acc[curr] = errorMessages[index];
    return acc;
  }, {});
  return { isFormInvalid, fieldErrors };
};

const useLowForm = ({
  submitCallback,
  formStateCallback,
  schema,
  previousSubmits = 0,
}: UseLowFormOptions): UseLowFormHookReturn => {
  const formValues = useRef<Record<string, any>>({});
  const [formState, setFormState] = useState<LowFormFormState>({
    isFormInvalid: false,
    isFormDirty: false,
    fieldErrors: {},
    submitCount: previousSubmits,
  });

  const updateFormStateOnSubmit = useCallback((errorState: Omit<LowFormFormState, 'submitCount' | 'isFormDirty'>) => {
    setFormState({
      submitCount: formState.submitCount + 1,
      isFormDirty: true,
      ...errorState,
    });
  }, [formState]);

  const setFormDirty = useCallback(() => {
    setFormState({
      ...formState,
      isFormDirty: true,
    });
  }, [formState]);

  const getFormState = useCallback(() => ({
    ...formState,
    formValues: formValues.current,
  }), [formState]);

  useEffect(() => {
    if (formStateCallback && formState.submitCount > 0) {
      formStateCallback(getFormState());
    }
  }, [getFormState, formStateCallback, formState.submitCount]);

  const registerElement = (key: string) => {
    if (typeof formValues.current[key] === 'undefined') {
      formValues.current[key] = '';
    }
    return (event: SyntheticEvent) => {
      if (!formState.isFormDirty) {
        setFormDirty();
      }
      formValues.current[key] = (event.target as HTMLInputElement).value;
    };
  };

  const handleFormSubmit = useCallback(async (event: SyntheticEvent) => {
    event.preventDefault();
    if (schema) {
      const errorResult = await validateSubmission(formValues.current, schema);
      if (errorResult.isFormInvalid) {
        updateFormStateOnSubmit(errorResult);
        return;
      }
    }
    updateFormStateOnSubmit({ isFormInvalid: false, fieldErrors: {} });
    submitCallback(formValues.current);
  }, [schema, submitCallback, updateFormStateOnSubmit]);

  return { registerElement, handleFormSubmit, getFormState };
};

export default useLowForm;

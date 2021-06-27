/* eslint-disable no-unused-vars */
import React, {
  FC,
  memo,
  cloneElement,
  isValidElement,
  CSSProperties,
  ReactNode,
  ReactNodeArray,
} from 'react';
import { AnyObjectSchema } from 'yup';
import useLowForm, { LowFormFormState } from './useLowForm';

export interface LowFormErrorComponentProps {
  message: string;
  name: string;
}

export interface LowFormProps {
  onSubmit: (formData: any) => void | Promise<void>;
  updateCallback?: (state: LowFormFormState) => void | Promise<void>;
  schema?: AnyObjectSchema;
  id?: string;
  isFormDisabled?: boolean;
  style?: CSSProperties;
  className?: string;
  autoComplete?: 'off' | 'on';
  errorComponent?: FC<LowFormErrorComponentProps>;
}

export const LowForm: FC<LowFormProps & { children?: ReactNode | ReactNodeArray }> = ({
  children: topLevelChildren,
  onSubmit: submitCallback,
  updateCallback: formStateCallback = () => {},
  schema,
  isFormDisabled,
  id: formId = 'form',
  errorComponent: ErrorComponent,
  style = {},
  autoComplete = 'on',
  className = '',
}) => {
  const { registerElement, handleFormSubmit, getFormState } = useLowForm({
    submitCallback,
    formStateCallback,
    schema,
  });

  const copyFormPropsToChildren: any = (providedChildren?: ReactNode | ReactNodeArray) => {
    if (!providedChildren) {
      return [];
    }
    const arrayCopy = (
      Array.isArray(providedChildren) ? [...providedChildren] : [providedChildren]
    );
    const mutatedArray: ReactNodeArray = [];
    arrayCopy.forEach((child, index) => {
      if (isValidElement(child)) {
        const {
          children,
          id,
          disabled: elementDisabled,
        } = child?.props;

        const disabled = elementDisabled || isFormDisabled;
        const isFormElement = id && (child.type === 'select' || child.type === 'input');
        const formState = getFormState();

        if (isFormElement) {
          mutatedArray.push(cloneElement(child, {
            key: `input-${formId}-${id}`,
            onChange: registerElement(id),
            disabled,
          }));

          if (ErrorComponent) {
            const message = formState?.fieldErrors?.[id];
            const WrappedErrorComponent = () => (
              message
                ? <ErrorComponent message={message} name={id} />
                : null
            );

            mutatedArray.push(<WrappedErrorComponent key={`error-${formId}-${id}`} />);
          }
        } else {
          mutatedArray.push(cloneElement(child, {
            key: `child-${formId}-${index}`,
            children: copyFormPropsToChildren(children),
            disabled,
          }));
        }
      } else {
        mutatedArray.push(child);
      }
    });

    return mutatedArray;
  };

  const childrenWithFormProps = copyFormPropsToChildren(topLevelChildren);

  return (
    <form
      data-testid="form"
      id={formId}
      style={style}
      className={className}
      onSubmit={handleFormSubmit}
      autoComplete={autoComplete}
    >
      {childrenWithFormProps}
    </form>
  );
};

export default memo(LowForm);

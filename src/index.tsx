/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-use-before-define
import React, {
  FC,
  Component,
  memo,
  cloneElement,
  isValidElement,
  ReactChild,
  CSSProperties,
  SyntheticEvent,
} from 'react';
import { useForm, FormState } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AnyObjectSchema } from 'yup';

export interface LowFormProps {
  onSubmit: (formData: unknown) => void | Promise<void>;
  stateHandler?: (formState: FormState<unknown>) => void | Promise<void>;
  schema?: AnyObjectSchema;
  formId?: string | number;
  isFormDisabled?: boolean;
  style?: CSSProperties;
  className?: string;
  autoComplete?: 'off' | 'on';
  errorComponent?: FC | Component;
}

export const LowForm: FC<LowFormProps & { children: ReactChild[] }> = ({
  children: topLevelChildren,
  onSubmit,
  schema,
  isFormDisabled,
  stateHandler,
  formId,
  errorComponent,
  style = {},
  autoComplete = 'on',
  className = '',
}) => {
  const formOpts = schema ? { resolver: yupResolver(schema) } : {};
  const {
    register,
    formState,
    handleSubmit,
  } = useForm(formOpts);
  const hookSubmission = handleSubmit(onSubmit);

  const submissionWrapper = (event: SyntheticEvent) => {
    event.preventDefault();
    if (stateHandler) {
      stateHandler(formState);
    }
    hookSubmission(event);
  };

  const copyFormPropsToChildren: any = (providedChildren: ReactChild | ReactChild[]) => {
    if (!providedChildren) {
      return [];
    }
    const arrayCopy = (
      Array.isArray(providedChildren) ? [...providedChildren] : [providedChildren]
    ).reverse();
    const mutatedArray = [];
    // eslint-disable-next-line no-plusplus
    for (let i = arrayCopy.length - 1; i >= 0; i--) {
      const child = arrayCopy[i];

      if (isValidElement(child)) {
        const {
          name,
          children,
          errorComponent: inputError,
          disabled: elementDisabled,
        } = child?.props;

        const disabled = elementDisabled || isFormDisabled;

        if (name) {
          mutatedArray.push(cloneElement(child, {
            key: `input-${formId}-${name}`,
            ...register(name),
            disabled,
          }));

          const ErrorComponent = inputError || errorComponent;

          if (ErrorComponent) {
            const message = formState?.errors[child.props.name]?.message;
            const WrappedErrorComponent = () => (
              message
                ? <ErrorComponent message={message} name={name} />
                : null
            );
            mutatedArray.splice(i + 1, 0, <WrappedErrorComponent key={`error-${formId}-${name}`} />);
          }
        } else {
          mutatedArray.push(cloneElement(child, {
            key: `child-${formId}-${i}`,
            children: copyFormPropsToChildren(children),
            disabled,
          }));
        }
      } else {
        mutatedArray.push(child);
      }
    }
    return mutatedArray;
  };

  const childrenWithFormProps = copyFormPropsToChildren(topLevelChildren);

  return (
    <form
      style={style}
      className={className}
      onSubmit={submissionWrapper}
      autoComplete={autoComplete}
    >
      {childrenWithFormProps}
    </form>
  );
};

export default memo(LowForm);

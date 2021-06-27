/* eslint-disable no-unused-vars */
import React, {
  FC,
  memo,
  cloneElement,
  isValidElement,
  CSSProperties,
  SyntheticEvent,
  ReactNode,
  ReactNodeArray,
} from 'react';
import { useForm, FormState } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AnyObjectSchema } from 'yup';

export interface LowFormErrorComponentProps {
  message: string;
  name: string;
}

export interface LowFormProps {
  onSubmit: (formData: any) => void | Promise<void>;
  stateHandler?: (formState: FormState<any>) => void | Promise<void>;
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
  onSubmit,
  schema,
  isFormDisabled,
  stateHandler,
  id: formId = 'form',
  errorComponent: ErrorComponent,
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

  const copyFormPropsToChildren: any = (providedChildren?: ReactNode | ReactNodeArray) => {
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
          children,
          id,
          disabled: elementDisabled,
        } = child?.props;

        const disabled = elementDisabled || isFormDisabled;
        const isFormElement = id && (child.type === 'select' || child.type === 'input');

        if (isFormElement) {
          mutatedArray.push(cloneElement(child, {
            key: `input-${formId}-${id}`,
            ...register(id),
            disabled,
          }));

          if (ErrorComponent) {
            const message = formState?.errors[id]?.message;
            const WrappedErrorComponent = () => (
              message
                ? <ErrorComponent message={message} name={id} />
                : null
            );

            mutatedArray.push(<WrappedErrorComponent key={`error-${formId}-${id}`} />);
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
      data-testid="form"
      id={formId}
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

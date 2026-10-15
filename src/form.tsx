import {
  Field as BoundField,
  useSelector,
  type DeepKeys,
  type DeepValue,
  type FieldValidateOrFn,
  type FieldAsyncValidateOrFn,
  type FormValidateOrFn,
  type FormAsyncValidateOrFn,
} from "@tanstack/react-form";
import type { ComponentProps, ReactNode } from "react";

import { Button, type ButtonProps } from "./components/button.js";
import { fieldError } from "./form-error.js";
import {
  Field,
  FormFooter,
  type FieldProps,
  type FormFooterProps,
} from "./components/field.js";

/** TanStack field binding with Caps labels, descriptions, errors, and control ARIA. */
export function FormField<
  TParentData,
  TName extends DeepKeys<TParentData>,
  TData extends DeepValue<TParentData, TName>,
  TOnMount extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChange extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnChangeAsync extends
    undefined | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnBlur extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnBlurAsync extends
    undefined | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnSubmit extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnSubmitAsync extends
    undefined | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TOnDynamic extends undefined | FieldValidateOrFn<TParentData, TName, TData>,
  TOnDynamicAsync extends
    undefined | FieldAsyncValidateOrFn<TParentData, TName, TData>,
  TFormOnMount extends undefined | FormValidateOrFn<TParentData>,
  TFormOnChange extends undefined | FormValidateOrFn<TParentData>,
  TFormOnChangeAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnBlur extends undefined | FormValidateOrFn<TParentData>,
  TFormOnBlurAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnSubmit extends undefined | FormValidateOrFn<TParentData>,
  TFormOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnDynamic extends undefined | FormValidateOrFn<TParentData>,
  TFormOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TParentData>,
  TFormOnServer extends undefined | FormAsyncValidateOrFn<TParentData>,
  TSubmitMeta,
>({
  children,
  label,
  description,
  orientation = "vertical",
  optional = false,
  required = false,
  className,
  ...options
}: ComponentProps<
  typeof BoundField<
    TParentData,
    TName,
    TData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TFormOnMount,
    TFormOnChange,
    TFormOnChangeAsync,
    TFormOnBlur,
    TFormOnBlurAsync,
    TFormOnSubmit,
    TFormOnSubmitAsync,
    TFormOnDynamic,
    TFormOnDynamicAsync,
    TFormOnServer,
    TSubmitMeta
  >
> &
  Pick<
    FieldProps,
    | "label"
    | "description"
    | "orientation"
    | "optional"
    | "required"
    | "className"
  >) {
  const submitted = useSelector(
    options.form.store,
    (state) => state.submissionAttempts > 0,
  );
  return (
    <BoundField {...options}>
      {(field) => (
        <Field
          label={label}
          description={description}
          orientation={orientation}
          optional={optional}
          required={required}
          className={className}
          error={
            field.state.meta.isBlurred || submitted
              ? fieldError(field.state.meta)
              : undefined
          }
        >
          {children(field)}
        </Field>
      )}
    </BoundField>
  );
}

/** Values read by the submit action from TanStack’s form store. */
export type SubmissionState = { canSubmit: boolean; isSubmitting: boolean };

/** Footer presentation plus the submit action; TanStack owns availability and busy state. */
export type SubmitFooterProps = Omit<FormFooterProps, "children"> & {
  form: {
    /** TanStack’s reactive selector component. */
    Subscribe: (props: {
      selector: (state: SubmissionState) => SubmissionState;
      children: (state: SubmissionState) => ReactNode;
    }) => ReactNode;
  };
  label: ReactNode;
  disabled?: boolean;
  buttonProps?: Omit<
    ButtonProps,
    "type" | "disabled" | "loading" | "children" | "onClick" | "asChild"
  >;
};

/** Submit button subscribed to TanStack's canSubmit/isSubmitting store state. */
export function SubmitFooter({
  form,
  label,
  disabled = false,
  buttonProps,
  ...props
}: SubmitFooterProps) {
  return (
    <form.Subscribe
      selector={({ canSubmit, isSubmitting }) => ({ canSubmit, isSubmitting })}
    >
      {({ canSubmit, isSubmitting }) => (
        <FormFooter {...props}>
          <Button
            {...buttonProps}
            type="submit"
            disabled={disabled || !canSubmit || isSubmitting}
            loading={isSubmitting}
          >
            {label}
          </Button>
        </FormFooter>
      )}
    </form.Subscribe>
  );
}

export { effectValidator, fieldError } from "./form-error.js";
export * from "./schema-form.js";
export { FormFields, type FormFieldsProps } from "./form-fields.js";
export * from "./form-schema.js";

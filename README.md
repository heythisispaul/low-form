# low-form
An experiment to create the lowest-impact React form API.

This library was created as the result of one question: What would a form with the least code overhead look like? What would a component that made HMTL forms that "just work" have to do? It provides a React component which can be wrapped around form elements in order to create a working, [uncontrolled](https://reactjs.org/docs/uncontrolled-components.html) form with simple features:

* Validation on submission
* Extendable submission handling
* Creates [ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) compliant labels
* Form-level and input-level error messaging
* Open to any styling

Please keep in mind, so far this is just an experiment and not necessarily intended for production use. The goal of this project was to experiment with creating the leanest API when constructing forms, not necessarily creating the most robust or performant. There's some anti-patterns happening, such as directly mutating `children` and native DOM elements. With this simplified boilerplate goal in mind, a lot of things have been abstracted away, and you may find that `low-form` will not meet all of your form-related needs. A few things that `low-form` *can't* do:

* onBlur checking
* Validation at onBlur and onChange
* Dynamically work with `input` or `select` elements that are not its direct children (they can be as deeply nested as needed)

However if you find that your form needs are simple, or you're also interested in the pursuit of the leanest form API, then please feel free to check it out.

## Install

```
npm install low-form
```

## Quick Start

```js
import Form from 'low-form';

const SimpleForm = () => {
  const onSubmit = (data) => console(data);
  return (
    <Form onSubmit={onSubmit}>
      <input id="first" aria-labelledby="First Name" />
      <input id="last" aria-labelledby="Last Name" />
      <input id="email" aria-labelledby="Email Address" defaultValue="example@example.com" />
      <button type="submit">Submit</button>
    </Form>
  );
};

export default SimpleForm;
```

The HMTL output of this form looks like:
```html
<div id="root">
  <form data-testid="form" id="form" class="" autocomplete="on">
    <label id="label-form-first" for="first">
      First Name
    </label>
    <input id="first" aria-labelledby="label-form-first">
    <label id="label-form-last" for="last">
      Last Name
    </label>
    <input id="last" aria-labelledby="label-form-last">
    <label id="label-form-email" for="email">
      Email Address
    </label>
    <input id="email" aria-labelledby="label-form-email" value="example@example.com">
    <button type="submit">Submit</button>
  </form>
</div>
```

Checkout a [Code Sandbox](#) of a styled version of this form.

In this example, `low-form` takes care of a few things for you:

* All of the form submission data is easily collected and handled with one function
* A `label` is generated and id-linked to each corresponding `input` and appended *before* each `input` as a sibling element
* The only one re-render required to complete the full transaction: The submit triggers a check of the state to determine what `onSubmit` should be provided

If you don't want or need the dynamically generated labels, then you can simply pass a `skipLabelGeneration` prop and they will be short-circuited during rendering. If you want to provide a custom class to the label elements rendered, a `labelClassName` can be provide to `Form` and it will be included during rendering.

## Validation

`low-form` can also handle validation and error messaging with the help of `yup`. To get started, install `yup`:

```
npm install yup
```

Now you can construct a schema to validate the form data against. You can also include an `errorComponent` prop which will be rendered with the corresponding `yup` message, as well as the `id` of the form element for which it corresponds to. Each of these components will be appended to the DOM as a sibling element *after* the form input they correspond to.

```js
import Form from 'low-form';
import * as yup from 'yup';

const schema = yup.object().shape({
  first: yup.string().min(2, 'Must be at least two characters long'),
  last: yup.string().min(2, 'This one also needs to be two characters long'),
  email: yup.string().email('Must be a valid email'),
  age: yup.number().min(14, 'Must be 14 years or older'),
})

const ErrorMessage = ({ message }) => <p>{message}</p>;

const ValidatedForm = () => {
  const onSubmit = (data) => console.log(data);
  return (
    <Form onSubmit={onSubmit} schema={schema} errorComponent={ErrorMessage}>
      <input id="first" aria-labelledby="First Name" />
      <input id="last" aria-labelledby="Last Name" />
      <input id="age" type="number" aria-labelledby="Age" defaultValue="3" />
      {/* Can also be enforced with type="email" */}
      <input id="email" aria-labelledby="Email Address" defaultValue="Not a valid email" />
      <button type="submit">Submit</button>
    </Form>
  );
};

export default ValidatedForm;
```

Checkout a [Code Sandbox](#) of a styled version of this form.

With thes two props, we've gained some helpful functionality:

* All values must pass their corresponding `yup` key's validation
* Components containing our error messages will automatically render if validation for that `input` fails
* Our submission will not be fired unless all validations pass

If you want more customization over your error messages, or do not want them appended to the DOM by default, an optional `updateCallback` can be provided to gain access to the form's general state and errors. This function is invoked on each submit, and will fire regardless of validation success. It is invoked with a `formState` argument which is an object with the following keys:

* `formData` (object): All of the form data, with the `input` id as the key, and it's input `value` as the value. The same thing that `onSubmit` is invoked with.
* `submitCount` (number): The count of how many times an attempt to submit has been made since mounting.
* `isFormInvalid` (boolean): Set to true if one or more inputs failed validation on the latest submit.
* `isFormDirty` (boolean): Set to true when any field value has been changed or if a submit was attempted.
* `fieldErrors` (object): Contains all of the `yup` keys and their corresponding error message if the validation failed. If the validation was successful, the key will still exist but its value is set to `null`.

## Full Form API

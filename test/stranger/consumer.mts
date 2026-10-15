import { createElement } from "react";
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import {
  FormField,
  SubmitFooter,
  effectValidator,
} from "@fungi.computer/caps/form";
import * as AsyncState from "@fungi.computer/caps/blocks/async-state";
import * as CommandMenu from "@fungi.computer/caps/blocks/command-menu";
import * as Composer from "@fungi.computer/caps/blocks/composer";
import * as EmptyState from "@fungi.computer/caps/blocks/empty-state";
import * as FaqChat from "@fungi.computer/caps/blocks/faq-chat";
import * as SpecSheet from "@fungi.computer/caps/blocks/spec-sheet";
import * as Mosaic from "@fungi.computer/caps/blocks/mosaic";
import * as PricingCard from "@fungi.computer/caps/blocks/pricing-card";
import * as ResourceSelect from "@fungi.computer/caps/blocks/resource-select";
import * as ResultState from "@fungi.computer/caps/blocks/result-state";
import * as SectionCard from "@fungi.computer/caps/blocks/section-card";
import * as UploadQueue from "@fungi.computer/caps/blocks/upload-queue";
import * as PermissionGrid from "@fungi.computer/caps/blocks/permission-grid";
import * as Alert from "@fungi.computer/caps/components/alert";
import * as Badge from "@fungi.computer/caps/components/badge";
import * as Button from "@fungi.computer/caps/components/button";
import * as Card from "@fungi.computer/caps/components/card";
import * as Checkbox from "@fungi.computer/caps/components/checkbox";
import * as Combobox from "@fungi.computer/caps/components/combobox";
import * as CountBadge from "@fungi.computer/caps/components/count-badge";
import * as DataList from "@fungi.computer/caps/components/data-list";
import * as Dialog from "@fungi.computer/caps/components/dialog";
import * as DropdownMenu from "@fungi.computer/caps/components/dropdown-menu";
import * as Field from "@fungi.computer/caps/components/field";
import * as IconButton from "@fungi.computer/caps/components/icon-button";
import * as Input from "@fungi.computer/caps/components/input";
import * as InputGroup from "@fungi.computer/caps/components/input-group";
import * as Label from "@fungi.computer/caps/components/label";
import * as Listbox from "@fungi.computer/caps/components/listbox";
import * as Progress from "@fungi.computer/caps/components/progress";
import * as Prose from "@fungi.computer/caps/components/prose";
import * as QuotaMeter from "@fungi.computer/caps/components/quota-meter";
import * as RadioGroup from "@fungi.computer/caps/components/radio-group";
import * as Select from "@fungi.computer/caps/components/select";
import * as Separator from "@fungi.computer/caps/components/separator";
import * as Slider from "@fungi.computer/caps/components/slider";
import * as Skeleton from "@fungi.computer/caps/components/skeleton";
import * as Loader from "@fungi.computer/caps/components/loader";
import * as Stat from "@fungi.computer/caps/components/stat";
import * as Status from "@fungi.computer/caps/components/status";
import * as Switch from "@fungi.computer/caps/components/switch";
import * as Tabs from "@fungi.computer/caps/components/tabs";
import * as Textarea from "@fungi.computer/caps/components/textarea";
import * as Tooltip from "@fungi.computer/caps/components/tooltip";
import * as VisuallyHidden from "@fungi.computer/caps/components/visually-hidden";
import * as Cn from "@fungi.computer/caps/lib/cn";

const modules: readonly object[] = [
  AsyncState,
  CommandMenu,
  Composer,
  EmptyState,
  FaqChat,
  SpecSheet,
  Mosaic,
  PricingCard,
  ResourceSelect,
  ResultState,
  SectionCard,
  UploadQueue,
  PermissionGrid,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Combobox,
  CountBadge,
  DataList,
  Dialog,
  DropdownMenu,
  Field,
  IconButton,
  Input,
  InputGroup,
  Label,
  Listbox,
  Progress,
  Prose,
  QuotaMeter,
  RadioGroup,
  Select,
  Separator,
  Slider,
  Skeleton,
  Loader,
  Stat,
  Status,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  VisuallyHidden,
  Cn,
];

void modules;

// Exercise inferred nested values through the packed declarations.
export function Settings() {
  const form = useForm({
    defaultValues: { profile: { name: "Levi" } },
    validators: {
      onChange: effectValidator(
        Schema.Struct({ profile: Schema.Struct({ name: Schema.String }) }),
      ),
    },
  });
  FormField({
    form,
    name: "profile.name",
    label: "Name",
    children: (field) => {
      const name: string = field.state.value;
      field.handleChange(name);
      return createElement("input", { value: name, onBlur: field.handleBlur });
    },
  });
  return createElement(SubmitFooter, { form, label: "Save" });
}

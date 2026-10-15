import { useEffect, useId } from "react";
import type { Story } from "@ladle/react";
import { X } from "lucide-react";
import { Toaster as CapsToaster, toast } from "../src/components/toaster.js";
import { Alert } from "../src/components/alert.js";
import { Button } from "../src/components/button.js";
import { IconButton } from "../src/components/icon-button.js";

export const Toaster: Story = () => {
  const id = useId();
  useEffect(
    () => () => {
      toast.dismiss(id);
    },
    [id],
  );
  return (
    <div className="p-lg" data-conformance="toaster">
      <CapsToaster id={id} />
      <Button
        onClick={() => {
          toast.custom(
            () => (
              <Alert
                title="Couldn’t upload image"
                tone="error"
                description="Connection interrupted. Your original file is safe."
                action={
                  <IconButton
                    aria-label="Dismiss notification"
                    icon={<X />}
                    onClick={() => toast.dismiss(id)}
                  />
                }
              />
            ),
            { id, toasterId: id, duration: Infinity },
          );
        }}
      >
        Show error toast
      </Button>
      <p className="py-md">
        Swipe up or right to dismiss. A short drag settles back into place.
      </p>
      <Alert
        title="Saved to Computer"
        tone="success"
        description="Molded alerts share the upload card’s shell."
      />
    </div>
  );
};

import { useEffect, useId } from "react";
import type { Story } from "@ladle/react";
import { Toaster as CapsToaster, toast } from "../src/components/toaster.js";
import { Alert } from "../src/components/alert.js";
import { Button } from "../src/components/button.js";

export const Toaster: Story = () => {
  const id = useId();
  useEffect(
    () => () => {
      toast.dismiss(id);
      toast.dismiss(`${id}-s`);
      toast.dismiss(`${id}-w`);
      toast.dismiss(`${id}-e`);
      toast.dismiss(`${id}-l`);
    },
    [id],
  );
  return (
    <div className="p-lg" data-conformance="toaster">
      <CapsToaster closeButton id={id} />
      <div className="flex flex-wrap gap-md">
        <Button
          onClick={() => {
            toast.warning("Check your connection", {
              id: `${id}-w`,
              toasterId: id,
              duration: Infinity,
            });
            toast.success("Saved hello.md", {
              id: `${id}-s`,
              toasterId: id,
              duration: Infinity,
            });
            toast.error("The model is not connected", {
              id: `${id}-e`,
              toasterId: id,
              duration: Infinity,
            });
            toast.loading("Making your image…", {
              id: `${id}-l`,
              toasterId: id,
              duration: Infinity,
            });
          }}
        >
          Show toasts
        </Button>
      </div>
      <Button
        onClick={() => {
          toast.error("Couldn’t upload image", {
            id,
            toasterId: id,
            description: "Connection interrupted. Your original file is safe.",
            duration: Infinity,
          });
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

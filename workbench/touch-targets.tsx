import type { Story } from "@ladle/react";
import { Button } from "../src/components/button.js";
import { Checkbox } from "../src/components/checkbox.js";
import { Field } from "../src/components/field.js";
import { Input } from "../src/components/input.js";
import { NavigationRail } from "../src/components/navigation-rail.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../src/components/dropdown-menu.js";

/** Resize to phone width: compact controls retain 44 px targets. */
export const TouchTargets: Story = () => (
  <section className="grid w-full max-w-(--container-md) gap-lg">
    <NavigationRail aria-label="Team">
      <a href="#computers" aria-current="page">
        Computers
      </a>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
          More
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Array.from({ length: 15 }, (_, index) => (
            <DropdownMenuItem key={index}>
              Destination {index + 1}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </NavigationRail>
    <Field label="Computer name">
      <Input defaultValue="cedar" />
    </Field>
    <Field label="Sign out other sessions" orientation="horizontal">
      <Checkbox defaultChecked />
    </Field>
    <div className="flex flex-wrap gap-md">
      <Button size="sm">Open workspace</Button>
      <Button size="sm" variant="outline">
        Detach
      </Button>
      <Button asChild size="sm" variant="link">
        <a href="#billing">Billing</a>
      </Button>
    </div>
  </section>
);

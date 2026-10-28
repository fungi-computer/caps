import { useState, type ReactNode } from "react";
import type { Story } from "@ladle/react";

import { Alert as CapsAlert } from "@fungi.computer/caps/components/alert";
import { Badge as CapsBadge } from "@fungi.computer/caps/components/badge";
import { Button as CapsButton } from "@fungi.computer/caps/components/button";
import {
  Card as CapsCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@fungi.computer/caps/components/card";
import { CountBadge as CapsCountBadge } from "@fungi.computer/caps/components/count-badge";
import { CoverPattern as CapsCoverPattern } from "@fungi.computer/caps/components/cover-pattern";
import { Eyebrow as CapsEyebrow } from "@fungi.computer/caps/blocks/section-heading";
import {
  DataList as CapsDataList,
  DataRow,
} from "@fungi.computer/caps/components/data-list";
import {
  Dialog as CapsDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fungi.computer/caps/components/dialog";
import {
  DropdownMenu as CapsDropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@fungi.computer/caps/components/dropdown-menu";
import { EmptyState as CapsEmptyState } from "@fungi.computer/caps/blocks/empty-state";
import { Field as CapsField } from "@fungi.computer/caps/components/field";
import { IconButton as CapsIconButton } from "@fungi.computer/caps/components/icon-button";
import { Input as CapsInput } from "@fungi.computer/caps/components/input";
import {
  InputGroup as CapsInputGroup,
  InputGroupAddon,
} from "@fungi.computer/caps/components/input-group";
import { Label as CapsLabel } from "@fungi.computer/caps/components/label";
import { Listbox as CapsListbox } from "@fungi.computer/caps/components/listbox";
import { Mosaic as CapsMosaic } from "@fungi.computer/caps/blocks/mosaic";
import { PricingCard as CapsPricingCard } from "@fungi.computer/caps/blocks/pricing-card";
import { ReleaseTag as CapsReleaseTag } from "@fungi.computer/caps/blocks/release-tag";
import { Rough as CapsRough } from "@fungi.computer/caps/components/rough";
import { Progress as CapsProgress } from "@fungi.computer/caps/components/progress";
import { Prose as CapsProse } from "@fungi.computer/caps/components/prose";
import { QuotaMeter as CapsQuotaMeter } from "@fungi.computer/caps/components/quota-meter";
import {
  RadioGroup as CapsRadioGroup,
  RadioGroupItem,
} from "@fungi.computer/caps/components/radio-group";
import { ResourceSelect as CapsResourceSelect } from "@fungi.computer/caps/blocks/resource-select";
import { ResultState as CapsResultState } from "@fungi.computer/caps/blocks/result-state";
import { SectionCard as CapsSectionCard } from "@fungi.computer/caps/blocks/section-card";
import { Slider as CapsSlider } from "@fungi.computer/caps/components/slider";
import { ScrollBlobExample } from "./water-drop.js";
import { Separator as CapsSeparator } from "@fungi.computer/caps/components/separator";
import { Skeleton as CapsSkeleton } from "@fungi.computer/caps/components/skeleton";
import { TradingCard as CapsTradingCard } from "@fungi.computer/caps/components/trading-card";
import { Loader as CapsLoader } from "@fungi.computer/caps/components/loader";
import { Stat as CapsStat } from "@fungi.computer/caps/components/stat";
import { Status as CapsStatus } from "@fungi.computer/caps/components/status";
import {
  Tabs as CapsTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@fungi.computer/caps/components/tabs";
import { Textarea as CapsTextarea } from "@fungi.computer/caps/components/textarea";
import {
  Tooltip as CapsTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fungi.computer/caps/components/tooltip";
import { UploadQueue as CapsUploadQueue } from "@fungi.computer/caps/blocks/upload-queue";
import { VisuallyHidden as CapsVisuallyHidden } from "@fungi.computer/caps/components/visually-hidden";
import { AsyncState as CapsAsyncState } from "@fungi.computer/caps/blocks/async-state";
import { CommandMenu as CapsCommandMenu } from "@fungi.computer/caps/blocks/command-menu";
import { Composer as CapsComposer } from "@fungi.computer/caps/blocks/composer";
import { SendAction as CapsSendAction } from "@fungi.computer/caps/components/send-action";
import { FaqChat as CapsFaqChat } from "@fungi.computer/caps/blocks/faq-chat";
import {
  SpecDiagram as CapsSpecDiagram,
  SpecFacts as CapsSpecFacts,
  SpecFaq as CapsSpecFaq,
  SpecFrame as CapsSpecFrame,
  SpecRuler as CapsSpecRuler,
  SpecSteps as CapsSpecSteps,
} from "@fungi.computer/caps/blocks/spec-sheet";

export type Theme = "latte" | "mocha";

function Surface({ children, theme }: { children: ReactNode; theme?: Theme }) {
  return (
    <div
      className="caps-workbench-surface"
      data-caps-workbench-theme={theme}
      data-theme={theme}
    >
      {children}
    </div>
  );
}

const noop = () => undefined;
const options = [
  { id: "alpha", label: "Alpha" },
  { id: "beta", label: "Beta" },
  { disabled: true, id: "gamma", label: "Gamma (disabled)" },
] as const;

export const Textarea: Story = () => (
  <Surface>
    <CapsTextarea
      aria-label="Description"
      data-conformance="textarea"
      defaultValue="A small world for a rainy afternoon."
      rows={3}
    />
  </Surface>
);

export const Label: Story = () => (
  <Surface>
    <CapsField data-conformance="label">
      <CapsLabel htmlFor="label-example">Name</CapsLabel>
      <CapsInput id="label-example" />
    </CapsField>
  </Surface>
);

export const Dialog: Story = () => (
  <Surface>
    <CapsDialog>
      <DialogTrigger data-conformance="dialog">Show details</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Details</DialogTitle>
          <DialogDescription>
            Shiitake runs on this Computer. Press Escape to close.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </CapsDialog>
  </Surface>
);

export const Mosaic: Story = () => (
  <Surface>
    <CapsMosaic
      data-conformance="mosaic"
      items={[
        { id: "one", state: "ready" },
        { id: "two", state: "loading" },
      ]}
      label="Worlds"
      onOpen={noop}
    />
  </Surface>
);

export const Composer: Story = () => (
  <Surface>
    <CapsComposer
      data-conformance="composer"
      attachments={
        <canvas
          aria-hidden="true"
          className="pointer-events-none size-12 shrink-0"
          height={48}
          width={48}
        />
      }
      input={
        <CapsTextarea
          aria-label="Message"
          className="min-h-12"
          placeholder="Ask Shiitake anything"
          rows={1}
        />
      }
      toolbar={<span className="text-xs">openai/gpt-6-luna</span>}
      action={<CapsSendAction aria-label="Send" onClick={noop} state="ready" />}
    />
  </Surface>
);

export const CommandMenu: Story = () => (
  <Surface>
    <CapsCommandMenu
      aria-label="Commands"
      data-conformance="command-menu"
      items={[
        { id: "first", label: "First command", description: "One" },
        { disabled: true, id: "second", label: "Disabled command" },
      ]}
      onSelect={noop}
    />
    <CapsCommandMenu
      aria-label="Keys"
      items={[
        { id: "zoom", label: "Zoom window", shortcut: "z" },
        { id: "open", label: "Open App", shortcut: "o" },
      ]}
      onSelect={noop}
    />
  </Surface>
);

export const ResourceSelect: Story = () => (
  <Surface>
    <CapsResourceSelect
      onSelect={noop}
      options={options}
      triggerProps={{
        "aria-label": "Choose resource",
        "data-conformance": "resource-select",
      }}
    />
  </Surface>
);

export const AsyncState: Story = () => (
  <Surface>
    <CapsAsyncState
      data-conformance="async-state"
      state="content"
      loading={<CapsLoader />}
      empty={
        <CapsEmptyState
          title="No Apps yet"
          description="Install one from Bazaar."
        />
      }
      error={<CapsAlert title="Apps did not load" />}
      content={
        <CapsCard>
          <CardContent>Three Apps installed on this Computer.</CardContent>
        </CapsCard>
      }
    />
  </Surface>
);

export const EmptyState: Story = () => (
  <Surface>
    <CapsEmptyState
      data-conformance="empty-state"
      title="Nothing here"
      description="Start a conversation and it shows up here."
      actions={<CapsButton>Continue</CapsButton>}
    />
  </Surface>
);

export const ResultState: Story = () => (
  <Surface>
    <CapsResultState
      data-conformance="result-state"
      title="Complete"
      description="Your files are saved to this Computer."
      actions={<CapsButton>Done</CapsButton>}
    />
  </Surface>
);

export const SectionCard: Story = () => (
  <Surface>
    <CapsSectionCard
      data-conformance="section-card"
      heading="Section"
      description="Who can open this Computer"
      actions={<CapsBadge>Ready</CapsBadge>}
    >
      <p>Only you, until you invite someone.</p>
    </CapsSectionCard>
  </Surface>
);

export const PricingCard: Story = () => (
  <Surface>
    <CapsPricingCard
      data-conformance="pricing-card"
      plan={{
        name: "Plan",
        description: "For one person and their Agents",
        price: "$10",
        interval: "/ month",
      }}
      features={
        <ul>
          <li>One Computer</li>
          <li>Every App in Bazaar</li>
        </ul>
      }
      action={<CapsButton>Choose</CapsButton>}
      status={<CapsBadge tone="success">Available</CapsBadge>}
    />
  </Surface>
);

const specArt = (
  <svg
    aria-label="Placeholder art"
    role="img"
    viewBox="0 0 4 3"
    width="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="currentColor" height="1" width="4" y="2" />
  </svg>
);

export const PricingCardSpec: Story = () => (
  <Surface>
    <div className="grid max-w-[48rem] grid-cols-1 gap-xl sm:grid-cols-2">
      <CapsPricingCard
        action={<CapsButton>Subscribe</CapsButton>}
        art={specArt}
        features={
          <ul>
            <li>One active request at a time</li>
            <li>A long feature line that wraps across more than one row</li>
          </ul>
        }
        plan={{
          description: "One request at a time.",
          interval: "/month",
          name: "Standard",
          price: "$6,500",
        }}
        layout="banded"
      />
      <CapsPricingCard
        action={<CapsButton variant="outline">Book a call</CapsButton>}
        featured
        features={
          <ul>
            <li>Two active requests at a time</li>
          </ul>
        }
        plan={{
          description: "Two requests at a time.",
          interval: "/month",
          name: "Priority",
          price: "$10,000",
        }}
        status={<span>Most room</span>}
        layout="banded"
      />
    </div>
  </Surface>
);

const faqEntries = [
  {
    actions: <CapsButton size="sm">Choose</CapsButton>,
    answer: <p>One Computer, every App in Bazaar and your own Agents.</p>,
    id: "plan",
    keywords: ["plan", "price"],
    question: "What does the plan include?",
  },
  {
    answer: (
      <p>
        A long answer that wraps over several lines to show how the log keeps
        its measure, scrolls inside its own frame and leaves the suggestions and
        the question field in place underneath it.
      </p>
    ),
    id: "long",
    keywords: ["long"],
    question: "A longer question that needs to wrap on a narrow screen?",
  },
] as const;

export const FaqChat: Story = () => (
  <Surface>
    <div className="grid grid-cols-1 gap-xl md:grid-cols-2">
      <CapsFaqChat
        className="h-96"
        data-conformance="faq-chat"
        entries={faqEntries}
        fallback={{ answer: <p>I only answer from this list.</p> }}
        greeting={<p>Pick a question or type one.</p>}
        note="Answers come from a fixed list."
        title="Ask about the plans"
      />
      <div className="max-w-(--container-xs)">
        <CapsFaqChat
          className="h-96"
          entries={faqEntries}
          fallback={{ answer: <p>I only answer from this list.</p> }}
          greeting={<p>Narrow host.</p>}
          title="Narrow"
        />
      </div>
    </div>
  </Surface>
);

export function SpecSheetExample({ theme }: { theme?: Theme }) {
  return (
    <Surface {...(theme === undefined ? {} : { theme })}>
      <div className="grid gap-xl" data-conformance="spec-sheet">
        <CapsSpecRuler label="01 · Plans" />
        <div className="grid grid-cols-1 gap-xl md:grid-cols-2">
          <CapsSpecFrame caption="Fig. 01 · placeholder art">
            {specArt}
          </CapsSpecFrame>
          <CapsSpecFrame caption="Readout" surface="inverse">
            <pre className="p-lg font-mono">{"status  ready\nqueue   3"}</pre>
          </CapsSpecFrame>
        </div>
        <CapsSpecDiagram
          art={specArt}
          markers={[
            {
              id: "a",
              label: "Left part",
              note: "A short note",
              tag: "A",
              x: 20,
              y: 70,
            },
            {
              id: "b",
              label: "Right part with a longer label",
              tag: "B",
              x: 80,
              y: 70,
            },
          ]}
        />
        <CapsSpecFacts
          facts={[
            { id: "years", label: "shipping web software", value: "10 yrs" },
            {
              id: "long",
              label:
                "a long label that wraps onto a second and a third line on a narrow screen",
              value: "1,384",
            },
            { id: "beta", label: "an agent platform", value: "Private beta" },
          ]}
        />
        <CapsSpecSteps
          steps={[
            { body: "Pick a plan and pay.", id: "a", title: "Subscribe" },
            {
              body: "Send what you need in plain words. Queue as many as you like, and this line keeps going to show a long body.",
              id: "b",
              title: "Request",
            },
            { body: "One request at a time.", id: "c", title: "Build" },
          ]}
        />
        <CapsSpecFaq
          defaultOpen={["open"]}
          items={[
            {
              answer: <p>This one starts open.</p>,
              id: "open",
              question: "What does an open answer look like?",
            },
            {
              answer: <p>Closed until someone asks.</p>,
              id: "closed",
              question:
                "A much longer question that has to wrap across two lines on a phone?",
            },
          ]}
        />
        <div className="flex flex-wrap gap-md">
          <CapsButton data-theme="chamfer">Subscribe</CapsButton>
          <CapsButton data-theme="chamfer" variant="outline">
            See the plans
          </CapsButton>
        </div>
      </div>
    </Surface>
  );
}

export const SpecSheet: Story = () => (
  <div className="grid gap-xl">
    <SpecSheetExample theme="latte" />
    <SpecSheetExample theme="mocha" />
  </div>
);

export const InputGroup: Story = () => (
  <Surface>
    <CapsInputGroup data-conformance="input-group">
      <InputGroupAddon>@</InputGroupAddon>
      <CapsInput aria-label="Handle" placeholder="handle" />
    </CapsInputGroup>
  </Surface>
);

export const Slider: Story = () => (
  <Surface>
    <CapsLabel htmlFor="slider-example">Value</CapsLabel>
    <CapsSlider
      data-conformance="slider"
      defaultValue={35}
      id="slider-example"
      max={100}
      min={0}
      step={5}
      tone="accent"
    />
  </Surface>
);

export const Card: Story = () => (
  <Surface>
    <CapsCard data-conformance="card" variant="outline">
      <CardHeader>
        <CardTitle>Card</CardTitle>
      </CardHeader>
      <CardContent>
        Shiitake keeps your Computer tidy while you sleep.
      </CardContent>
    </CapsCard>
  </Surface>
);

export const ReleaseTag: Story = () => (
  <Surface>
    <div className="w-48 pt-lg">
      <CapsReleaseTag
        entries={[
          { name: "Grove", version: "0.3" },
          { name: "Shed", version: "0.2" },
          { name: "Vishnu", version: "0.1" },
        ]}
        label="Update"
        title={["Fungi", "Beta"]}
      />
    </div>
  </Surface>
);

export const Rough: Story = () => (
  <Surface>
    <div className="grid max-w-[28rem] gap-xl p-lg text-lg">
      <p>
        Stop shoving your craft into someone else&apos;s{" "}
        <CapsRough animate seed={5} mark="circle" tone="primary">
          clanker
        </CapsRough>
        .
      </p>
      <p>
        Everything here is{" "}
        <CapsRough seed={2} mark="underline" tone="primary">
          yours
        </CapsRough>{" "}
        to{" "}
        <CapsRough seed={8} mark="highlight">
          change
        </CapsRough>
        .
      </p>
      <CapsRough block seed={3} mark="box">
        <p className="p-md">A hand-drawn box around any card.</p>
      </CapsRough>
      <CapsRough block seed={6} mark="bubble" tail="left">
        <p className="px-lg py-md">Hi! I live in a speech bubble.</p>
      </CapsRough>
    </div>
  </Surface>
);

export const TradingCard: Story = () => (
  <Surface>
    <div className="grid max-w-(--container-sm) gap-lg">
      <CapsTradingCard
        art={<CapsBadge tone="primary">Art window</CapsBadge>}
        facts={[
          { label: "Weakness", value: "Meetings ×2" },
          { label: "Resistance", value: "Lock-in −30" },
          { label: "Retreat", value: "Free" },
        ]}
        finish="holo"
        flavor="It naps on its own computer until you give it something to do."
        move={{
          cost: "✦✦",
          name: "Say hello",
          value: "30",
          children: (
            <div className="grid gap-xs">
              <CapsLabel htmlFor="trading-card-email">Your email</CapsLabel>
              <CapsInput id="trading-card-email" type="email" />
            </div>
          ),
        }}
        name="Shiitake"
        rarity="★"
        setNumber="001/001"
        stage="Spore"
        stat="60 SP"
        typeLine="Mushroom agent"
      />
    </div>
  </Surface>
);

export const Separator: Story = () => (
  <Surface>
    <div>Above</div>
    <CapsSeparator data-conformance="separator" />
    <div>Below</div>
  </Surface>
);

export const VisuallyHidden: Story = () => (
  <Surface>
    <CapsButton data-conformance="visually-hidden">
      <CapsVisuallyHidden>Visually hidden context</CapsVisuallyHidden>
      <span aria-hidden="true">+</span>
    </CapsButton>
  </Surface>
);

export const Prose: Story = () => (
  <Surface>
    <CapsProse data-conformance="prose">
      <h2>Prose</h2>
      <p>Long-form text keeps a calm measure and a readable rhythm.</p>
    </CapsProse>
  </Surface>
);

export const Badge: Story = () => (
  <Surface>
    <CapsBadge data-conformance="badge" tone="info">
      Informational
    </CapsBadge>
  </Surface>
);

export const Alert: Story = () => (
  <Surface>
    <CapsAlert
      data-conformance="alert"
      title="Notice"
      description="Your Computer restarts in five minutes."
      tone="info"
    />
  </Surface>
);

export const CountBadge: Story = () => (
  <Surface>
    <CapsCountBadge count={4} data-conformance="count-badge" label="Items" />
  </Surface>
);

export const Eyebrow: Story = () => (
  <Surface>
    <div className="flex flex-col gap-md">
      <CapsEyebrow data-conformance="eyebrow">Live worlds</CapsEyebrow>
      <CapsEyebrow tone="primary">Agents made some of these</CapsEyebrow>
      <CapsEyebrow tone="secondary">The creator corner</CapsEyebrow>
      <CapsEyebrow tone="live">On air right now</CapsEyebrow>
    </div>
  </Surface>
);

export const CoverPattern: Story = () => (
  <Surface>
    <div className="grid grid-cols-2 gap-md sm:grid-cols-3">
      {[
        "the-clearing",
        "moss-golf",
        "bell-tower",
        "skyblock",
        "pirates",
        "lantern",
      ].map((seed) => (
        <div className="aspect-video overflow-hidden rounded-box" key={seed}>
          <CapsCoverPattern label={`${seed} cover`} seed={seed} />
        </div>
      ))}
    </div>
  </Surface>
);

export const ScrollToBottomBlob: Story = () => <ScrollBlobExample />;

export const Progress: Story = () => (
  <Surface>
    <CapsProgress
      aria-label="Progress"
      data-conformance="progress"
      max={100}
      tone="success"
      value={72}
    />
  </Surface>
);

export const Loader: Story = () => (
  <Surface>
    <div className="flex flex-wrap gap-xl" data-conformance="loader">
      {(["line", "wander", "square", "donut", "bloom"] as const).map(
        (variant) => (
          <section key={variant} className="flex flex-col gap-sm">
            <h3 className="font-semibold capitalize">{variant}</h3>
            <div className="flex items-center gap-md">
              <CapsLoader
                variant={variant}
                size="sm"
                label={`${variant}, small`}
              />
              <CapsLoader
                variant={variant}
                size="md"
                label={`${variant}, medium`}
              />
              <CapsLoader
                variant={variant}
                size="lg"
                tone="accent"
                label={`${variant}, large`}
              />
            </div>
          </section>
        ),
      )}
    </div>
  </Surface>
);

export const Skeleton: Story = () => (
  <Surface>
    <div className="grid max-w-(--container-md) gap-sm">
      <CapsSkeleton
        aria-label="Loading placeholder"
        className="block h-6 w-1/2"
        data-conformance="skeleton"
      />
      <CapsSkeleton className="block h-4 w-full" />
      <CapsSkeleton className="block h-4 w-4/5" />
    </div>
  </Surface>
);

export const Stat: Story = () => (
  <Surface>
    <CapsStat
      data-conformance="stat"
      label="Requests"
      value="42"
      description="This period"
    />
  </Surface>
);

export const QuotaMeter: Story = () => (
  <Surface>
    <CapsQuotaMeter
      data-conformance="quota-meter"
      description="Files, Apps and snapshots on this Computer."
      label="Storage"
      max={100}
      value={42}
      valueLabel="42 GB"
      maxLabel="100 GB"
      tone="info"
    />
  </Surface>
);

export const DataList: Story = () => (
  <Surface>
    <CapsDataList data-conformance="data-list">
      <DataRow>
        <span>Owner</span>
        <strong>Ada</strong>
      </DataRow>
      <DataRow>
        <span>Status</span>
        <strong>Ready</strong>
      </DataRow>
    </CapsDataList>
  </Surface>
);

export const Tabs: Story = () => (
  <Surface>
    <CapsTabs data-conformance="tabs" defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        Three Apps running, two Agents idle.
      </TabsContent>
      <TabsContent value="activity">
        Shiitake tidied your files an hour ago.
      </TabsContent>
    </CapsTabs>
    <CapsTabs className="mt-lg" defaultValue="sign-in">
      <TabsList aria-label="Account choice" variant="segmented">
        <TabsTrigger value="sign-in">Sign in</TabsTrigger>
        <TabsTrigger value="create">Create account</TabsTrigger>
      </TabsList>
      <TabsContent value="sign-in">
        Welcome back. Sign in with your email.
      </TabsContent>
      <TabsContent value="create">
        New here? Make an account in a minute.
      </TabsContent>
    </CapsTabs>
  </Surface>
);

export const Listbox: Story = () => (
  <Surface>
    <CapsListbox
      data-conformance="listbox"
      defaultValue="alpha"
      getKey={(item: (typeof options)[number]) => item.id}
      getLabel={(item: (typeof options)[number]) => item.label}
      items={options}
      onValueChange={noop}
      renderItem={(
        item: (typeof options)[number],
        _active: boolean,
        state: { active: boolean; disabled: boolean; selected: boolean },
      ) => (
        <span>
          {item.label}
          {state.selected ? " ✓" : ""}
        </span>
      )}
    />
  </Surface>
);

export const DropdownMenu: Story = () => (
  <Surface>
    <CapsDropdownMenu>
      <DropdownMenuTrigger data-conformance="dropdown-menu">
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={noop}>Open</DropdownMenuItem>
        <DropdownMenuCheckboxItem defaultChecked onCheckedChange={noop}>
          Pinned
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Close</DropdownMenuItem>
      </DropdownMenuContent>
    </CapsDropdownMenu>
  </Surface>
);

export const Tooltip: Story = () => (
  <Surface>
    <CapsTooltip data-conformance="tooltip">
      <TooltipTrigger aria-label="More information">?</TooltipTrigger>
      <TooltipContent>Additional context</TooltipContent>
    </CapsTooltip>
  </Surface>
);

export const Themes: Story = () => (
  <div className="caps-workbench-theme-grid">
    <Surface theme="latte">
      <CapsCard>
        <CardContent>
          <CapsBadge tone="primary">Latte</CapsBadge>
        </CardContent>
      </CapsCard>
    </Surface>
    <Surface theme="mocha">
      <CapsCard>
        <CardContent>
          <CapsBadge tone="accent">Mocha</CapsBadge>
        </CardContent>
      </CapsCard>
    </Surface>
  </div>
);

export const ControlledInteraction: Story = () => (
  <ControlledInteractionExample />
);
function ControlledInteractionExample() {
  const [value, setValue] = useState("latte");
  const [callbackCount, setCallbackCount] = useState(0);
  return (
    <Surface>
      <div
        data-callback-count={callbackCount}
        data-caps-workbench-controlled
        data-interaction="controlled"
        data-value={value}
        onClick={() => {
          setCallbackCount((count) => count + 1);
        }}
      >
        <CapsButton
          onClick={() => {
            setValue(value === "latte" ? "mocha" : "latte");
          }}
        >
          Toggle controlled value
        </CapsButton>
        <CapsRadioGroup
          aria-label="Controlled theme"
          onValueChange={(next: string) => {
            setCallbackCount((count) => count + 1);
            setValue(next);
          }}
          value={value}
          orientation="horizontal"
        >
          <CapsLabel>
            <RadioGroupItem value="latte" /> Latte
          </CapsLabel>
          <CapsLabel>
            <RadioGroupItem value="mocha" /> Mocha
          </CapsLabel>
        </CapsRadioGroup>
        <p aria-live="polite">Selected: {value}</p>
      </div>
    </Surface>
  );
}

export const UncontrolledInteraction: Story = () => (
  <Surface>
    <div data-interaction="uncontrolled" data-caps-workbench-uncontrolled>
      <CapsTabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </CapsTabs>
    </div>
  </Surface>
);

export const KeyboardFocus: Story = () => (
  <Surface>
    <div data-interaction="keyboard-focus">
      <CapsCommandMenu
        aria-label="Keyboard commands"
        data-caps-workbench-keyboard
        items={[
          { id: "first", label: "First" },
          { id: "second", label: "Second" },
        ]}
        onSelect={noop}
      />
      <p>Focus the list and use ArrowDown, Home, End, or Enter.</p>
    </div>
  </Surface>
);

export const AccessibleState: Story = () => (
  <Surface>
    <div data-interaction="accessible-state">
      <CapsLabel htmlFor="accessible-input">Accessible field</CapsLabel>
      <CapsInput
        aria-invalid="true"
        aria-describedby="accessible-help"
        aria-label="Accessible field"
        data-caps-workbench-accessible
        id="accessible-input"
      />
      <p id="accessible-help">The host owns this validation message.</p>
      <CapsProgress aria-label="Accessible progress" max={100} value={50} />
    </div>
  </Surface>
);

export const CleanupRemount: Story = () => <CleanupRemountExample />;
function CleanupRemountExample() {
  const [mounted, setMounted] = useState(true);
  return (
    <Surface>
      <div
        data-interaction="cleanup-remount"
        data-caps-workbench-cleanup
        data-cleanup-state={mounted ? "clean" : "unmounted"}
      >
        <CapsButton
          onClick={() => {
            setMounted((current) => !current);
          }}
        >
          {mounted ? "Unmount" : "Remount"}
        </CapsButton>
        {mounted ? (
          <CapsTooltip>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent>Cleanly removable content</TooltipContent>
          </CapsTooltip>
        ) : null}
      </div>
    </Surface>
  );
}

export const ResponsiveDensity: Story = () => (
  <Surface>
    <div
      className="caps-workbench-responsive"
      data-interaction="responsive-density"
      data-caps-workbench-responsive
    >
      <CapsCard>
        <CardContent>
          <CapsStat label="Compact" value="12" />
        </CardContent>
      </CapsCard>
      <CapsCard>
        <CardContent>
          <CapsQuotaMeter label="Room" max={100} value={64} />
        </CardContent>
      </CapsCard>
    </div>
  </Surface>
);

export const DashboardComposition: Story = () => <DashboardFixture />;

function DashboardFixture() {
  const [events, setEvents] = useState<string[]>([]);
  const recordEvent = (event: string) => {
    setEvents((current) => [...current, event].slice(-3));
  };
  const lastEvent = events.at(-1) ?? "none";
  return (
    <Surface>
      <div
        className="caps-workbench-dashboard"
        data-caps-workbench-composition="dashboard"
        data-callback-count={events.length}
        data-composition="dashboard"
        data-last-event={lastEvent}
      >
        <header className="caps-workbench-dashboard-header">
          <div>
            <h1 className="caps-workbench-title">Overview</h1>
            <p className="caps-workbench-muted">Your Computer this week</p>
          </div>
          <CapsIconButton
            aria-label="Open details"
            icon={<span>⋯</span>}
            onClick={() => {
              recordEvent("details");
            }}
          />
        </header>
        <div className="caps-workbench-dashboard-stats">
          <CapsStat label="Items" value="12" />
          <CapsStat label="Ready" value="8" />
          <CapsStat label="Usage" value="64%" />
        </div>
        <CapsSectionCard
          heading="Activity"
          description="What changed recently"
          actions={
            <CapsButton
              size="sm"
              variant="outline"
              onClick={() => {
                recordEvent("view-all");
              }}
            >
              View all
            </CapsButton>
          }
        >
          <CapsDataList>
            <DataRow>Activity complete</DataRow>
            <DataRow>Connection ready</DataRow>
          </CapsDataList>
        </CapsSectionCard>
        <CapsVisuallyHidden>
          <output aria-live="polite" data-caps-workbench-dashboard-events>
            {lastEvent} ({events.length})
          </output>
        </CapsVisuallyHidden>
      </div>
    </Surface>
  );
}

export const ParakeetComposition: Story = () => <ParakeetFixture />;

function ParakeetFixture() {
  const [messages, setMessages] = useState(["Hi! What should we make today?"]);
  const [events, setEvents] = useState<string[]>([]);
  const recordEvent = (event: string) => {
    setEvents((current) => [...current, event].slice(-3));
  };
  const send = () => {
    setMessages((current) =>
      [...current, "Sent. Shiitake is on it."].slice(-3),
    );
    recordEvent("send");
  };
  const lastEvent = events.at(-1) ?? "none";
  return (
    <Surface theme="mocha">
      <div
        className="caps-workbench-parakeet"
        data-caps-workbench-composition="parakeet"
        data-callback-count={events.length}
        data-composition="parakeet"
        data-last-event={lastEvent}
      >
        <CapsCard variant="interactive">
          <CardHeader>
            <div className="caps-workbench-parakeet-header">
              <CardTitle>Interface</CardTitle>
              <CapsStatus label="Ready" tone="success" />
            </div>
          </CardHeader>
          <CardContent>
            <CapsComposer
              input={<CapsInput aria-label="Message" placeholder="Message" />}
              action={<CapsButton onClick={send}>Send</CapsButton>}
            />
            <div className="caps-workbench-parakeet-spacing">
              <CapsAsyncState
                state="content"
                loading={<CapsLoader />}
                empty={
                  <CapsEmptyState
                    title="No messages yet"
                    description="Say hello to start."
                  />
                }
                error={<CapsAlert title="Error" />}
                content={
                  <CapsProse>
                    {messages.map((message, index) => (
                      <p key={`${message}-${String(index)}`}>{message}</p>
                    ))}
                  </CapsProse>
                }
              />
            </div>
          </CardContent>
        </CapsCard>
        <CapsUploadQueue
          items={[
            {
              actions: {
                cancel: { accessibleLabel: "Cancel item", label: "Cancel" },
                remove: { accessibleLabel: "Remove item", label: "Remove" },
                retry: { accessibleLabel: "Retry item", label: "Retry" },
              },
              id: "asset-1",
              name: "asset.txt",
              preview: { kind: "file" },
              progress: 100,
              progressLabel: "100%",
              statusLabel: "Complete",
            },
          ]}
          onCancel={() => {
            recordEvent("upload-cancel");
          }}
          onRemove={() => {
            recordEvent("upload-remove");
          }}
          onRetry={() => {
            recordEvent("upload-retry");
          }}
        />
        <CapsVisuallyHidden>
          <output aria-live="polite" data-caps-workbench-parakeet-events>
            {lastEvent} ({events.length})
          </output>
        </CapsVisuallyHidden>
      </div>
    </Surface>
  );
}

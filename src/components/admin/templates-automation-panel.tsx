"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/sounds/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveTaskTemplateAction,
  createAutomationRuleAction,
  createTaskFromTemplateAction,
  createTaskTemplateAction,
  setAutomationRuleActiveAction,
} from "@/lib/tasks/m8-actions";
import {
  AUTOMATION_ACTIONS,
  AUTOMATION_TRIGGERS,
  type AutomationRule,
  type TaskTemplate,
} from "@/lib/tasks/m8-types";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type NestFlowWorkspace,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/types";

export function TemplatesAutomationPanel({
  templates,
  rules,
  workspaces,
}: {
  templates: TaskTemplate[];
  rules: AutomationRule[];
  workspaces: NestFlowWorkspace[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [workspaceKind, setWorkspaceKind] = useState<"hr" | "general">("hr");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [spawnWorkspaceId, setSpawnWorkspaceId] = useState(
    workspaces[0]?.id ?? "",
  );

  const [ruleName, setRuleName] = useState("");
  const [triggerType, setTriggerType] =
    useState<(typeof AUTOMATION_TRIGGERS)[number]>("status_changed");
  const [toStatus, setToStatus] = useState<TaskStatus | "any">("review");
  const [actionType, setActionType] =
    useState<(typeof AUTOMATION_ACTIONS)[number]>("request_approval");
  const [actionValue, setActionValue] = useState("");

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Task templates
          </h2>
          <p className="text-sm text-muted-foreground">
            Repeatable HR and team checklists. Spawn creates a real task with
            the template checklist.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/80 p-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Name</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New starter onboarding"
            />
            <Label htmlFor="tpl-desc">Description</Label>
            <Textarea
              id="tpl-desc"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-check">Checklist (one per line)</Label>
            <Textarea
              id="tpl-check"
              rows={5}
              value={checklistText}
              onChange={(event) => setChecklistText(event.target.value)}
              placeholder={"Collect equipment&#10;Confirm Nest ID".replace(
                "&#10;",
                "\n",
              )}
            />
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={workspaceKind}
                onValueChange={(value) =>
                  setWorkspaceKind(value as "hr" | "general")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PRIORITY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const checklistTitles = checklistText
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean);
                  const result = await createTaskTemplateAction({
                    name,
                    description,
                    workspaceKind,
                    defaultPriority: priority,
                    defaultStatus: status,
                    checklistTitles,
                  });
                  if (!result.ok) {
                    toast.error(result.error ?? "Could not create template.");
                    return;
                  }
                  toast.success("Template created.");
                  setName("");
                  setDescription("");
                  setChecklistText("");
                  router.refresh();
                });
              }}
            >
              Save template
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active templates yet.
            </p>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.workspaceKind.toUpperCase()} ·{" "}
                    {PRIORITY_LABELS[template.defaultPriority]} ·{" "}
                    {template.checklistTitles.length} checklist items
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {workspaces.length > 0 ? (
                    <>
                      <Select
                        value={spawnWorkspaceId}
                        onValueChange={setSpawnWorkspaceId}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaces.map((workspace) => (
                            <SelectItem key={workspace.id} value={workspace.id}>
                              {workspace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending || !spawnWorkspaceId}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await createTaskFromTemplateAction({
                              templateId: template.id,
                              workspaceId: spawnWorkspaceId,
                            });
                            if (!result.ok) {
                              toast.error(
                                result.error ?? "Could not spawn task.",
                              );
                              return;
                            }
                            toast.success("Task created from template.");
                            if (result.taskId) {
                              router.push(`/app/tasks/${result.taskId}`);
                            }
                            router.refresh();
                          });
                        }}
                      >
                        Spawn task
                      </Button>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await archiveTaskTemplateAction(
                          template.id,
                        );
                        if (!result.ok) {
                          toast.error(result.error ?? "Could not archive.");
                          return;
                        }
                        toast.success("Template archived.");
                        router.refresh();
                      });
                    }}
                  >
                    Archive
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            Automation rules
          </h2>
          <p className="text-sm text-muted-foreground">
            Lightweight triggers for review, completion, and task creation.
            Rules run on the server after matching events.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/80 p-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule name</Label>
            <Input
              id="rule-name"
              value={ruleName}
              onChange={(event) => setRuleName(event.target.value)}
              placeholder="Request approval on review"
            />
            <Label>Trigger</Label>
            <Select
              value={triggerType}
              onValueChange={(value) =>
                setTriggerType(value as (typeof AUTOMATION_TRIGGERS)[number])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTOMATION_TRIGGERS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>To status (optional for status triggers)</Label>
            <Select
              value={toStatus}
              onValueChange={(value) =>
                setToStatus(value as TaskStatus | "any")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {TASK_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <Select
              value={actionType}
              onValueChange={(value) =>
                setActionType(value as (typeof AUTOMATION_ACTIONS)[number])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTOMATION_ACTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="action-value">Action value</Label>
            <Input
              id="action-value"
              value={actionValue}
              onChange={(event) => setActionValue(event.target.value)}
              placeholder="Priority value, checklist title, or message"
            />
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await createAutomationRuleAction({
                    name: ruleName,
                    triggerType,
                    toStatus: toStatus === "any" ? null : toStatus,
                    actionType,
                    actionValue,
                  });
                  if (!result.ok) {
                    toast.error(result.error ?? "Could not create rule.");
                    return;
                  }
                  toast.success("Automation rule saved.");
                  setRuleName("");
                  setActionValue("");
                  router.refresh();
                });
              }}
            >
              Save rule
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No automation rules.</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {rule.name}
                    {!rule.isActive ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (off)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rule.triggerType.replaceAll("_", " ")}
                    {rule.toStatus ? ` → ${STATUS_LABELS[rule.toStatus]}` : ""}
                    {" · "}
                    {rule.actionType.replaceAll("_", " ")}
                    {rule.actionValue ? `: ${rule.actionValue}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await setAutomationRuleActiveAction({
                        ruleId: rule.id,
                        isActive: !rule.isActive,
                      });
                      if (!result.ok) {
                        toast.error(result.error ?? "Update failed.");
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  {rule.isActive ? "Disable" : "Enable"}
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

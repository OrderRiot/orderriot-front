import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBackCampaign } from "@/lib/queries";
import { apiError } from "@/lib/api";
import type { Reward, PaymentMode } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function BackDialog({
  open,
  onOpenChange,
  campId,
  reward,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campId: number;
  reward?: Reward | null;
}) {
  const back = useBackCampaign();
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<PaymentMode>("card");

  useEffect(() => {
    if (open) {
      setAmount(reward ? String(reward.min_amount) : "10");
      setMode("card");
    }
  }, [open, reward]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (reward && n < reward.min_amount) {
      toast.error(`Minimum for this tier is ${formatMoney(reward.min_amount)}.`);
      return;
    }
    try {
      await back.mutateAsync({
        camp_id: campId,
        reward_id: reward?.reward_id,
        contrib_amount: n,
        payment_mode: mode,
      });
      toast.success("Pledge placed. Thank you.");
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="editorial-index">— Pledge</div>
          <DialogTitle>
            {reward ? `Back · ${reward.title}` : "Back this campaign"}
          </DialogTitle>
          <DialogDescription>
            {reward
              ? `Minimum ${formatMoney(reward.min_amount)}. Pledge more if you want.`
              : "Choose any amount. Every dollar gets the project closer."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6 mt-2">
          <div>
            <Label htmlFor="amount">Pledge amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="text-3xl font-display h-14 tnum"
            />
          </div>

          <div>
            <Label>Payment</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            All-or-nothing: you'll only be charged if the campaign hits its
            goal by the deadline.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={back.isPending}>
              {back.isPending
                ? "Placing pledge…"
                : `Pledge ${amount ? formatMoney(Number(amount)) : ""}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

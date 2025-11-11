"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface DateRangePickerProps {
  onUpdate?: (values: { dateFrom?: Date; dateTo?: Date }) => void;
  initialDateFrom?: Date | string;
  initialDateTo?: Date | string;
  align?: "start" | "center" | "end";
}

export const DateRangePicker = ({
  onUpdate,
  initialDateFrom,
  initialDateTo,
  align = "end",
}: DateRangePickerProps) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    initialDateFrom ? new Date(initialDateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    initialDateTo ? new Date(initialDateTo) : undefined
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleDateFromChange = (value: string) => {
    const date = value ? new Date(value) : undefined;
    setDateFrom(date);
    if (onUpdate) {
      onUpdate({ dateFrom: date, dateTo: dateTo });
    }
  };

  const handleDateToChange = (value: string) => {
    const date = value ? new Date(value) : undefined;
    setDateTo(date);
    if (onUpdate) {
      onUpdate({ dateFrom: dateFrom, dateTo: date });
    }
  };

  const handleClear = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    if (onUpdate) {
      onUpdate({ dateFrom: undefined, dateTo: undefined });
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const displayText =
    dateFrom && dateTo
      ? `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
      : dateFrom
      ? `Desde ${formatDate(dateFrom)}`
      : dateTo
      ? `Até ${formatDate(dateTo)}`
      : "Selecione o período";

  const hasSelection = dateFrom || dateTo;

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-10 w-full justify-start text-left font-normal shadow-sm transition-all hover:shadow-md sm:w-[280px]",
            !hasSelection && "text-muted-foreground",
            hasSelection && "border-primary/20 bg-primary/5"
          )}
          variant="outline"
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[calc(100vw-2rem)] p-0 sm:w-[340px]">
        <div className="flex flex-col">
          <div className="border-border/60 border-b bg-muted/30 px-4 py-3">
            <h3 className="font-semibold text-sm">Selecionar período</h3>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Escolha as datas inicial e final
            </p>
          </div>

          <div className="space-y-5 p-4">
            <div className="space-y-2.5">
              <Label
                className="font-medium text-foreground text-sm"
                htmlFor="date-from"
              >
                Data inicial
              </Label>
              <Input
                className={cn(
                  "h-10 transition-colors",
                  dateFrom && "border-primary/50 bg-primary/5"
                )}
                id="date-from"
                onChange={(e) => handleDateFromChange(e.target.value)}
                type="date"
                value={dateFrom ? dateFrom.toISOString().split("T")[0] : ""}
              />
              {dateFrom && (
                <p className="text-muted-foreground text-xs">
                  {formatDate(dateFrom)}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label
                className="font-medium text-foreground text-sm"
                htmlFor="date-to"
              >
                Data final
              </Label>
              <Input
                className={cn(
                  "h-10 transition-colors",
                  dateTo && "border-primary/50 bg-primary/5"
                )}
                id="date-to"
                onChange={(e) => handleDateToChange(e.target.value)}
                type="date"
                value={dateTo ? dateTo.toISOString().split("T")[0] : ""}
              />
              {dateTo && (
                <p className="text-muted-foreground text-xs">
                  {formatDate(dateTo)}
                </p>
              )}
            </div>
          </div>

          <div className="border-border/60 border-t bg-muted/20 px-4 py-3">
            <div className="flex gap-2.5">
              <Button
                className="flex-1"
                disabled={!hasSelection}
                onClick={handleClear}
                size="sm"
                variant="outline"
              >
                Limpar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setIsOpen(false)}
                size="sm"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { utils } from "ethers"
import { useFieldArray, useForm } from "react-hook-form"
import { useAccount, useWalletClient } from "wagmi"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  victimAddress: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
  newAddress: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
  txHashs: z.array(
    z.object({
      hash: z.string().min(2, { message: "Please enter a valid hash." }),
      chainName: z.string().min(1, { message: "Please select chain." }),
    })
  ),
})

type FormValues = z.infer<typeof formSchema>

// This can come from your database or API.
const defaultValues: Partial<FormValues> = {
  txHashs: [
    {
      hash: "0x9cf7036aef81df2c0e48de0bb2e32270ee3283d5",
      chainName: "Arbitrum",
    },
    {
      hash: "0xd334dfdecb041336b1d3cf6d541f1e4143dae3f2",
      chainName: "Ethereum",
    },
    {
      hash: "0x50a6b8218013edec354a1f62f04ac841c68d5a37",
      chainName: "BNB Chain",
    },
  ],
}

export default function IndexPage() {
  const walletClient = useWalletClient().data
  const account = useAccount()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  })

  useEffect(() => {
    form.setValue("victimAddress", account.address || "")
  }, [account])

  const { fields, append } = useFieldArray({
    name: "txHashs",
    control: form.control,
  })

  async function onSubmit(data: FormValues) {
    try {
      if (data.victimAddress == data.newAddress)
        throw new Error(
          "The new address cannot be the same as the victim address"
        )

      // TODO: Use ethers.js check the new address validity
      if (!utils.isAddress(data.newAddress))
        throw new Error("The new address is an invalid Ethereum address")

      let message = `I want to receive a compensation related to the Orbiter of between 2023-06-01 03:30:00(UTC +0) and 21:30:00(UTC +0).\n`
      message += `Victim Address: ${data.victimAddress}\n`
      message += `New Address: ${data.newAddress}\n`
      message += `Transaction list:\n`
      message += data.txHashs
        .map((item, index) => `${index + 1}. ${item.hash} on ${item.chainName}`)
        .join("\n")
      const signature = await walletClient?.signMessage({ message })

      const v = utils.verifyMessage(message, signature!)
      if (v != data.victimAddress)
        throw new Error("Signer does not match victim address")

      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    } catch (err: any) {
      toast({
        title: `Submit failed:`,
        description: err.message,
        variant: "destructive",
      })
    }
  }

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10 flex justify-items-start">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="victimAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Victim Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Form item introduction. Form item introduction. Form item
                    introduction. Form item introduction.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Form item introduction. Form item introduction. Form item
                    introduction. Form item introduction.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="newAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verified email to display" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="m@example.com">
                        m@example.com
                      </SelectItem>
                      <SelectItem value="m@google.com">m@google.com</SelectItem>
                      <SelectItem value="m@support.com">
                        m@support.com
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can manage verified email addresses in your{" "}
                    <Link href="/examples/forms">email settings</Link>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <div>
              {fields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`txHashs.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        Transaction Hashs
                      </FormLabel>
                      <FormDescription className={cn(index !== 0 && "sr-only")}>
                        Form item introduction. Form item introduction. Form
                        item introduction. Form item introduction.
                      </FormDescription>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-1"
                onClick={() => append({ hash: "", chainName: "" })}
              >
                Add Transaction Hash
              </Button>
            </div>
            <Button type="submit">SignMessage & Submit</Button>
          </form>
        </Form>
      </div>
    </section>
  )
}

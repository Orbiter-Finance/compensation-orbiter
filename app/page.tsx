"use client"

import { useEffect } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { utils } from "ethers"
import { useFieldArray, useForm } from "react-hook-form"
import { useAccount, useWalletClient } from "wagmi"
import * as z from "zod"
import { whiteList } from "@/config/whiteList"
import axios from "@/node_modules/axios";

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
  ticketId: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
  txHashs: z.array(
    z.object({
      hash: z.string().min(2, { message: "Please enter a valid hash." }),
      chainName: z.string().min(1, { message: "Please select chain." }),
    })
  ),
  signature: z.string().optional(),
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
      if (!new RegExp(/^0x[a-fA-F0-9]{40}$/).test(data.victimAddress)) {
        throw new Error(
          `Wrong victim address format`
        );
      }
      if (!new RegExp(/^0x[a-fA-F0-9]{40}$/).test(data.newAddress)) {
        throw new Error(
          `Wrong new address format`
        );
      }
      if (!whiteList.find(item => item.toLowerCase() === data.victimAddress.toLowerCase())) {
        throw new Error(
          `${data.victimAddress} not victim address`
        );
      }
      if (data.victimAddress == data.newAddress)
        throw new Error(
          "The new address cannot be the same as the victim address"
        )

      // TODO: Use ethers.js check the new address validity
      if (!utils.isAddress(data.newAddress))
        throw new Error("The new address is an invalid Ethereum address")

      let message = `I want to receive a compensation related to the Orbiter of between 2023-06-01 03:30:00(UTC +0) and 21:30:00(UTC +0).\n`
      message += `Victim Address: ${data.victimAddress.toLowerCase()}\n`
      message += `New Address: ${data.newAddress.toLowerCase()}`
      data.signature = await walletClient!.signMessage({ message })

      // const v = utils.verifyMessage(message, data.signature)
      // if (v != data.victimAddress)
      //   throw new Error("Signer does not match victim address")
      const res = await axios.post("https://dapi.orbiter.finance/api/submit", {
        oldAddress: data.victimAddress,
        newAddress: data.newAddress,
        ticketId: data.ticketId,
        signature: data.signature
      });

      if (!res?.data?.message) {
        throw new Error(
          "Network Error"
        )
      } else {
        toast({
          description: (
            res?.data?.message
          ),
        });
      }
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
                <FormItem style={{width:700}}>
                  <FormLabel>Victim Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} disabled />
                  </FormControl>
                  {/*<FormDescription>*/}
                  {/*  Form item introduction. Form item introduction. Form item*/}
                  {/*  introduction. Form item introduction.*/}
                  {/*</FormDescription>*/}
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
                  {/*<FormDescription>*/}
                  {/*  Form item introduction. Form item introduction. Form item*/}
                  {/*  introduction. Form item introduction.*/}
                  {/*</FormDescription>*/}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ticketId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Id</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  {/*<FormDescription>*/}
                  {/*  Form item introduction. Form item introduction. Form item*/}
                  {/*  introduction. Form item introduction.*/}
                  {/*</FormDescription>*/}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">SignMessage & Submit</Button>
          </form>
        </Form>
      </div>
    </section>
  )
}

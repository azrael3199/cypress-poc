import { stripe } from "@/lib/stripe";
import { createOrRetrieveCustomer } from "@/lib/stripe/adminTasks";
import { getUrl } from "@/lib/utils";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  cookies().getAll();
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Could not find the user");

    const customer = await createOrRetrieveCustomer({
      email: user.email || "",
      uuid: user.id || "",
    });
    if (!customer) throw new Error("No Customer");
    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${getUrl()}/dashboard`,
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.log("ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

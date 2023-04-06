import styles from "@/styles/Home.module.css";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useState } from "react";
import Stripe from "stripe";

interface IPrice extends Stripe.Price {
  product: Stripe.Product;
}
interface IProps {
  prices: IPrice[];
}
export default function Home({ prices }: IProps) {
  const [item, setItem] = useState<IPrice | null>(null);
  console.log({ prices });
  const publishableKey = process.env
    .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;
  const stripePromise = loadStripe(publishableKey);
  const createCheckOutSession = async () => {
    if (item) {
      const stripe = await stripePromise;
      const checkoutSession = await axios.post("/api/create-stripe-session", {
        item: {
          name: item.product.name,
          description: item.product.description,
          image: item.product.images[0],
          quantity: 1,
          price: item.unit_amount,
        },
      });
      const result = await stripe.redirectToCheckout({
        sessionId: checkoutSession.data.id,
      });
      if (result.error) {
        alert(result.error.message);
      }
    }
  };

  return (
    <>
      <main className={styles.main}>
        {prices.map((price) => (
          <div key={price.id}>
            <h2>{price.product.name}</h2>
            <Image
              src={price.product.images[0]}
              width={300}
              height={300}
              alt={price.product.name}
            />
            <p>Cost: ${((price.unit_amount as number) / 100).toFixed(2)}</p>
            <button
              onClick={() => setItem(price)}
              className="bg-blue-500 hover:bg-blue-600 text-white block w-full py-2 rounded mt-2 disabled:cursor-not-allowed disabled:bg-blue-100"
            >
              Buy
            </button>
          </div>
        ))}
      </main>
      <button
        onClick={createCheckOutSession}
        className="bg-blue-500 hover:bg-blue-600 text-white block w-full py-2 rounded mt-2 disabled:cursor-not-allowed disabled:bg-blue-100"
      >
        Checkout
      </button>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2022-11-15",
  });

  const prices = await stripe.prices.list({
    expand: ["data.product"],
  });

  return { props: { prices: prices.data } };
};

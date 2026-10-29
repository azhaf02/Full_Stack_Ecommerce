import { useState } from "react";

export type PaymentMethod = "ONLINE" | "COD";

interface PaymentMethodStepProps {
	checkoutSessionId: string;
	onContinue: (method: PaymentMethod) => Promise<void>;
}

export default function PaymentMethodStep({
	checkoutSessionId,
	onContinue,
}: PaymentMethodStepProps) {
	const [method, setMethod] = useState<PaymentMethod | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleContinue() {
		if (!method) {
			setError("Please select a payment method.");
			return;
		}

		if (!checkoutSessionId) {
			setError("Checkout session is missing.");
			return;
		}

		setError("");
		setLoading(true);

		try {
			await onContinue(method);
		} catch {
			setError("Unable to save your selection. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<section className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow">
			<h2 className="mb-5 text-2xl font-bold text-gray-900">
				Select Payment Method
			</h2>

			<div className="space-y-4">
				<label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
					<input
						type="radio"
						name="paymentMethod"
						value="ONLINE"
						checked={method === "ONLINE"}
						onChange={() => {
							setMethod("ONLINE");
							setError("");
						}}
					/>
					<span>Online Payment</span>
				</label>

				<label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
					<input
						type="radio"
						name="paymentMethod"
						value="COD"
						checked={method === "COD"}
						onChange={() => {
							setMethod("COD");
							setError("");
						}}
					/>
					<span>Cash on Delivery</span>
				</label>
			</div>

			{error && (
				<p role="alert" className="mt-4 text-sm text-red-600">
					{error}
				</p>
			)}

			<button
				type="button"
				onClick={handleContinue}
				disabled={loading}
				className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
			>
				{loading ? "Saving..." : "Continue"}
			</button>
		</section>
	);
}

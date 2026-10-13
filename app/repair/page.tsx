"use client";

import { useEffect, useState } from "react";


// ======================================================
// Types
// ======================================================

type Branch = {
  id: string;
  name: string;
};


// ⭐ ເພີ່ມ: Customer Type

type Customer = {
  id: string;
  fullName: string;
  phone: string | null;
};


type RepairJob = {
  id: string;
  ticketNo: string;
  deviceDescription: string;
  issueDescription: string;
  status: string;

  customer: {
    fullName: string;
  };
};


// ======================================================
// Repair Status
// ======================================================

const COLUMNS = [
  "PENDING",
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
  "DONE",
  "DELIVERED",
];


const COLUMN_LABEL: Record<string, string> = {
  PENDING: "ລໍຖ້າ (Pending)",
  IN_PROGRESS: "ກຳລັງຊ່ອມ",
  WAITING_FOR_PARTS: "ລໍອາໄຫຼ່",
  DONE: "ແລ້ວເສັດ",
  DELIVERED: "ສົ່ງແລ້ວ",
};


// ======================================================
// Component
// ======================================================

export default function RepairPage() {

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");

  const [jobs, setJobs] = useState<RepairJob[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);
 
  const [showNewCustomer, setShowNewCustomer] =
    useState(false);

  const [newCustomerName, setNewCustomerName] =
    useState("");

  const [newCustomerPhone, setNewCustomerPhone] =
    useState("");

  const [customerLoading, setCustomerLoading] =
    useState(false);

  const [form, setForm] = useState({
    deviceDescription: "",
    passcode: "",
    issueDescription: "",
  });


  const [message, setMessage] =
    useState<string | null>(null);

  function loadJobs(bId: string) {

    fetch(
      `/api/repair-jobs${
        bId ? `?branchId=${bId}` : ""
      }`
    )
      .then((r) => r.json())
      .then((data) => {

        if (Array.isArray(data)) {
          setJobs(data);
        }

      })
      .catch((error) => {
        console.error("Load repair jobs error:", error);
      });
  }

  useEffect(() => {

    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {

        if (Array.isArray(data)) {

          setBranches(data);

          if (data[0]) {

            setBranchId(data[0].id);

            loadJobs(data[0].id);
          }
        }

      })
      .catch((error) => {
        console.error("Load branches error:", error);
      });

  }, []);

  useEffect(() => {

    if (!customerSearch.trim()) {

      setCustomers([]);

      return;
    }

    const timer = setTimeout(async () => {

      try {

        const res = await fetch(
          `/api/customers?search=${encodeURIComponent(
            customerSearch.trim()
          )}`
        );


        const data = await res.json();


        if (Array.isArray(data)) {

          setCustomers(data);

        } else {

          setCustomers([]);

        }

      } catch (error) {

        console.error(
          "Customer search error:",
          error
        );

        setCustomers([]);
      }

    }, 300);


    return () => clearTimeout(timer);

  }, [customerSearch]);

  async function createJob(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setMessage(null);

    if (!selectedCustomer) {

      setMessage(
        "ກະລຸນາຄົ້ນຫາ ແລະ ເລືອກລູກຄ້າ"
      );

      return;
    }

    const res = await fetch(
      "/api/repair-jobs",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          branchId,

          customerId: selectedCustomer.id,

          deviceDescription:
            form.deviceDescription,

          passcode:
            form.passcode,

          issueDescription:
            form.issueDescription,
        }),
      }
    );


    const data = await res.json();


    if (!res.ok) {

      setMessage(
        data.error ||
          "ບໍ່ສາມາດອອກໃບຮັບຊ່ອມ"
      );

      return;
    }

    setMessage(
      `ອອກໃບຮັບຊ່ອມ ${data.ticketNo} ສຳເລັດ`
    );

    setSelectedCustomer(null);

    setCustomerSearch("");

    setCustomers([]);

    setForm({
      deviceDescription: "",
      passcode: "",
      issueDescription: "",
    });

    loadJobs(branchId);
  }

  async function moveStatus(
    jobId: string,
    status: string
  ) {

    await fetch(
      `/api/repair-jobs/${jobId}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status,
        }),
      }
    );


    loadJobs(branchId);
  }

  async function createCustomer() {

    if (!newCustomerName.trim()) {

      alert(
        "ກະລຸນາປ້ອນຊື່ລູກຄ້າ"
      );

      return;
    }


    setCustomerLoading(true);


    try {

      const res = await fetch(
        "/api/customers",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            fullName:
              newCustomerName.trim(),

            phone:
              newCustomerPhone.trim(),
          }),
        }
      );


      const data = await res.json();


      if (!res.ok) {

        alert(
          data.error ||
            "ບໍ່ສາມາດເພີ່ມລູກຄ້າ"
        );

        return;
      }

      setSelectedCustomer(data);

      setCustomerSearch("");

      setCustomers([]);

      setShowNewCustomer(false);


      // Clear New Customer Form

      setNewCustomerName("");

      setNewCustomerPhone("");

    } catch (error) {

      console.error(
        "Create customer error:",
        error
      );

      alert(
        "ເກີດຂໍ້ຜິດພາດ"
      );

    } finally {

      setCustomerLoading(false);

    }
  }

  return (

    <div className="min-h-screen bg-white text-gray-100 p-4 md:p-6 space-y-6">

      {/* =================================================
          Header
      ================================================= */}

      <div className="border-b border-neutral-800 pb-4">

        <h1 className="font-display text-2xl md:text-3xl font-bold text-blue-500 tracking-wide">

          🛠️ ຮັບຊ່ອມ ແລະ ຕິດຕາມງານຊ່ອມ

        </h1>


        <p className="text-gray-700 text-xs md:text-sm mt-1">

          Pending ➔ In Progress ➔ Waiting for Parts ➔ Done ➔ Delivered

        </p>

      </div>


      {/* =================================================
          Main
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">


        {/* =================================================
            Repair Form
        ================================================= */}

        <form
          onSubmit={createJob}
          className="bg-white border border-neutral-800 rounded-xl p-5 space-y-3 lg:col-span-1 shadow-xl"
        >

          <h3 className="font-display font-semibold text-lg text-gray-700 border-b border-neutral-800 pb-2">

            + ອອກໃບຮັບຊ່ອມໃໝ່

          </h3>


          {/* =================================================
              Branch
          ================================================= */}

          <div>

            <label className="text-xs text-gray-700 block mb-1">
              ສາຂາ
            </label>


            <select
              className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none"
              value={branchId}
              onChange={(e) => {

                setBranchId(e.target.value);

                loadJobs(e.target.value);

              }}
            >

              {branches.map((b) => (

                <option
                  key={b.id}
                  value={b.id}
                >
                  {b.name}
                </option>

              ))}

            </select>

          </div>


          {/* =================================================
              ⭐⭐⭐ CUSTOMER SEARCH ⭐⭐⭐
              ⭐ ເພີ່ມບ່ອນນີ້
          ================================================= */}

          <div className="relative">

            <label className="text-xs text-gray-700 block mb-1">

              ລູກຄ້າ *

            </label>


            {/* =================================================
                Selected Customer
            ================================================= */}

            {selectedCustomer ? (

              <div className="border border-blue-500 bg-blue-50 rounded-lg p-3">

                <div className="flex justify-between items-start">

                  <div>

                    <div className="font-semibold text-sm text-gray-800">

                      {selectedCustomer.fullName}

                    </div>


                    <div className="text-[11px] text-gray-500 mt-1">

                      ID: {selectedCustomer.id}

                    </div>


                    {selectedCustomer.phone && (

                      <div className="text-[11px] text-gray-500">

                        📞 {selectedCustomer.phone}

                      </div>

                    )}

                  </div>


                  {/* Remove Customer */}

                  <button
                    type="button"
                    onClick={() => {

                      setSelectedCustomer(null);

                      setCustomerSearch("");

                    }}
                    className="text-red-500 font-bold"
                  >

                    ✕

                  </button>

                </div>

              </div>

            ) : (

              <>
                {/* =================================================
                    Search Input
                ================================================= */}

                <input
                  type="text"
                  className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
                  placeholder="ພິມຊື່ / ID / ເບີໂທ..."
                  value={customerSearch}
                  onChange={(e) => {

                    setCustomerSearch(
                      e.target.value
                    );

                    setShowNewCustomer(false);

                  }}
                />


                {/* =================================================
                    ⭐ Customer Dropdown
                ================================================= */}

                {customerSearch.trim() && (

                  <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">


                    {customers.length > 0 ? (

                      customers.map(
                        (customer) => (

                          <button
                            key={customer.id}
                            type="button"

                            onClick={() => {

                              setSelectedCustomer(
                                customer
                              );

                              setCustomerSearch("");

                              setCustomers([]);

                              setShowNewCustomer(false);

                            }}

                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100"
                          >

                            <div className="text-sm font-semibold text-gray-800">

                              {customer.fullName}

                            </div>


                            <div className="text-[11px] text-gray-500">

                              ID: {customer.id}

                            </div>


                            {customer.phone && (

                              <div className="text-[11px] text-gray-500">

                                📞 {customer.phone}

                              </div>

                            )}

                          </button>

                        )
                      )

                    ) : (

                      /* =================================================
                         ⭐ No Customer
                         ເພີ່ມລູກຄ້າໃໝ່
                      ================================================= */

                      <div className="p-3">

                        <div className="text-xs text-gray-500 mb-2">

                          ບໍ່ພົບລູກຄ້າ

                        </div>


                        <button
                          type="button"

                          onClick={() => {

                            setShowNewCustomer(true);

                            setNewCustomerName(
                              customerSearch
                            );

                          }}

                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg"
                        >

                          + ເພີ່ມລູກຄ້າໃໝ່

                        </button>

                      </div>

                    )}

                  </div>

                )}

              </>

            )}


            {/* =================================================
                ⭐⭐⭐ NEW CUSTOMER FORM ⭐⭐⭐
                ⭐ ເພີ່ມບ່ອນນີ້
            ================================================= */}

            {showNewCustomer &&
              !selectedCustomer && (

                <div className="mt-2 border border-blue-300 bg-blue-50 rounded-lg p-3 space-y-2">

                  <div className="text-xs font-bold text-blue-700">

                    + ເພີ່ມລູກຄ້າໃໝ່

                  </div>


                  {/* Name */}

                  <input
                    type="text"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700"
                    placeholder="ຊື່ລູກຄ້າ"
                    value={newCustomerName}
                    onChange={(e) =>
                      setNewCustomerName(
                        e.target.value
                      )
                    }
                  />


                  {/* Phone */}

                  <input
                    type="text"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700"
                    placeholder="ເບີໂທ"
                    value={newCustomerPhone}
                    onChange={(e) =>
                      setNewCustomerPhone(
                        e.target.value
                      )
                    }
                  />


                  {/* Buttons */}

                  <div className="flex gap-2">

                    <button
                      type="button"
                      disabled={customerLoading}
                      onClick={createCustomer}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-bold py-2 rounded-lg"
                    >

                      {customerLoading
                        ? "ກຳລັງບັນທຶກ..."
                        : "✓ ບັນທຶກ"}

                    </button>


                    <button
                      type="button"
                      onClick={() => {

                        setShowNewCustomer(false);

                        setNewCustomerName("");

                        setNewCustomerPhone("");

                      }}
                      className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg"
                    >

                      ຍົກເລີກ

                    </button>

                  </div>

                </div>

              )}

          </div>


          {/* =================================================
              Device
          ================================================= */}

          <input
            className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none"
            placeholder="ລຸ້ນເຄື່ອງ ເຊັ່ນ iPhone 13 Pro"
            value={form.deviceDescription}
            onChange={(e) =>
              setForm({
                ...form,
                deviceDescription:
                  e.target.value,
              })
            }
          />


          {/* =================================================
              Passcode
          ================================================= */}

          <input
            className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none font-mono"
            placeholder="Passcode / Pattern lock"
            value={form.passcode}
            onChange={(e) =>
              setForm({
                ...form,
                passcode: e.target.value,
              })
            }
          />


          {/* =================================================
              Issue
          ================================================= */}

          <textarea
            className="w-full bg-white border border-neutral-700 rounded-lg px-3 py-2 text-xs text-gray-700 h-24 focus:outline-none"
            placeholder="ອາການເສຍ..."
            value={form.issueDescription}
            onChange={(e) =>
              setForm({
                ...form,
                issueDescription:
                  e.target.value,
              })
            }
          />


          {/* =================================================
              Submit
          ================================================= */}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-xs"
          >

            + ອອກໃບຮັບຊ່ອມ

          </button>


          {/* =================================================
              Message
          ================================================= */}

          {message && (

            <p className="text-xs text-emerald-500">

              {message}

            </p>

          )}

        </form>


        {/* =================================================
            Kanban
        ================================================= */}

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">

          {COLUMNS.map((col) => (

            <div
              key={col}
              className="bg-white border border-neutral-800 rounded-xl p-3 shadow-md"
            >

              <div className="text-xs font-bold text-gray-700 border-b border-neutral-800 pb-2 mb-3">

                {COLUMN_LABEL[col]}

              </div>


              <div className="space-y-2">

                {jobs
                  .filter(
                    (j) => j.status === col
                  )
                  .map((j) => (

                    <div
                      key={j.id}
                      className="bg-white border border-neutral-800 rounded-lg p-2.5 space-y-1"
                    >

                      <div className="text-xs font-semibold text-gray-700">

                        {j.deviceDescription}

                      </div>


                      <div className="font-mono text-[10px] text-amber-500">

                        {j.ticketNo}

                      </div>


                      {/* ⭐ ເພີ່ມ: Customer name */}

                      <div className="text-[10px] text-blue-600">

                        👤 {j.customer?.fullName || "ບໍ່ມີຂໍ້ມູນ"}

                      </div>


                      <div className="text-[11px] text-gray-400 line-clamp-2">

                        {j.issueDescription}

                      </div>


                      <div className="flex gap-1 mt-2 flex-wrap border-t border-neutral-900 pt-1.5">

                        {COLUMNS
                          .filter(
                            (c) => c !== col
                          )
                          .map((next) => (

                            <button
                              key={next}
                              type="button"
                              onClick={() =>
                                moveStatus(
                                  j.id,
                                  next
                                )
                              }
                              className="text-[9px] bg-neutral-900 hover:bg-neutral-800 text-gray-300 px-1.5 py-0.5 rounded border border-neutral-700"
                            >

                              ➔ {COLUMN_LABEL[next]}

                            </button>

                          ))}

                      </div>

                    </div>

                  ))}

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
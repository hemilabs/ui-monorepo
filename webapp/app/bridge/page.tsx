export default function Bridge() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col px-8 pt-8 lg:pt-20">
      <main className="flex flex-col rounded-2xl bg-white px-6 pb-4 pt-6 text-zinc-800">
        <h3 className="text-xl font-medium text-black">Bridge</h3>
        <div className="my-2">
          <div className="flex h-9 items-center gap-x-2 rounded-xl bg-[#FF684B]/10 px-2 text-xs text-zinc-800">
            <svg
              fill="none"
              height="18"
              viewBox="0 0 19 18"
              width="19"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.5 1.5C5.36 1.5 2 4.86 2 9C2 13.14 5.36 16.5 9.5 16.5C13.64 16.5 17 13.14 17 9C17 4.86 13.64 1.5 9.5 1.5ZM9.5 9.75C9.0875 9.75 8.75 9.4125 8.75 9V6C8.75 5.5875 9.0875 5.25 9.5 5.25C9.9125 5.25 10.25 5.5875 10.25 6V9C10.25 9.4125 9.9125 9.75 9.5 9.75ZM10.25 12.75H8.75V11.25H10.25V12.75Z"
                fill="#323232"
              />
            </svg>
            <span className="font-normal">Wrong Network</span>
            <button className="ml-auto cursor-pointer underline">
              Switch to BVM
            </button>
          </div>
        </div>
        <div className="my-2 flex items-center justify-between text-sm">
          <span className="font-medium">From Network</span>
          <span className="text-xs">Chain Selector</span>
        </div>
        <div className="flex justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400">
          <div className="flex flex-col gap-y-2">
            <span className="text-xs font-normal">You send</span>
            <div className="flex items-center gap-x-2">
              <button className="cursor-pointer rounded-md bg-gray-200 p-[6px]">
                <svg
                  fill="none"
                  height="12"
                  viewBox="0 0 13 12"
                  width="13"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.60251 3.86954L3.69236 3.868V6.85181C3.69236 7.20464 3.98588 7.49067 4.34796 7.49067C4.71004 7.49067 5.00356 7.20464 5.00356 6.85181V3.86615L6.09341 3.86461C6.45704 3.8641 6.55205 3.65511 6.30406 3.39622L4.6099 1.62755C4.44458 1.45496 4.17654 1.45975 4.02038 1.62839L2.38366 3.3958C2.1409 3.65796 2.2376 3.87006 2.60251 3.86954Z"
                    fill="#17171A"
                  />
                  <path
                    d="M7.41024 8.13046L8.50009 8.132V5.14819C8.50009 4.79536 8.79361 4.50933 9.15569 4.50933C9.51777 4.50933 9.81129 4.79536 9.81129 5.14819V8.13385L10.9011 8.13539C11.2648 8.1359 11.3598 8.34489 11.1118 8.60378L9.41763 10.3724C9.25231 10.545 8.98427 10.5402 8.82811 10.3716L7.19139 8.6042C6.94863 8.34204 7.04533 8.12994 7.41024 8.13046Z"
                    fill="#17171A"
                  />
                </svg>
              </button>
              <div className="flex w-1/5">
                $
                <input
                  className="ml-1 max-w-28 bg-transparent text-base font-medium text-neutral-400"
                  defaultValue="0"
                  type="text"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <span className="text-xs">Token selector</span>
            <div className="flex items-center gap-x-2 text-sm font-normal">
              <span>Balance: 5.609</span>
              <button className="cursor-pointer font-semibold text-slate-700">
                MAX
              </button>
            </div>
          </div>
        </div>
        <div className="my-6 flex w-full">
          <button className="mx-auto cursor-pointer rounded-lg p-2 shadow-xl">
            <svg
              fill="none"
              height="16"
              viewBox="0 0 22 16"
              width="22"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 8H1.20711C0.761654 8 0.538571 8.53857 0.853553 8.85355L3.64645 11.6464C3.84171 11.8417 4.15829 11.8417 4.35355 11.6464L7.14645 8.85355C7.46143 8.53857 7.23835 8 6.79289 8H5C5 4.69 7.69 2 11 2C11.8773 2 12.7169 2.18863 13.4663 2.53312C13.6675 2.62557 13.9073 2.59266 14.0638 2.43616L14.8193 1.68072C15.0455 1.45454 15.0041 1.07636 14.7216 0.926334C13.5783 0.3192 12.3008 -0.000361652 11 3.07144e-07C6.58 3.07144e-07 3 3.58 3 8ZM17 8C17 11.31 14.31 14 11 14C10.1471 14.0029 9.30537 13.8199 8.53281 13.4656C8.33221 13.3736 8.09316 13.4068 7.9371 13.5629L7.18072 14.3193C6.95454 14.5455 6.99594 14.9236 7.27843 15.0737C8.42167 15.6808 9.69924 16.0004 11 16C15.42 16 19 12.42 19 8H20.7929C21.2383 8 21.4614 7.46143 21.1464 7.14645L18.3536 4.35355C18.1583 4.15829 17.8417 4.15829 17.6464 4.35355L14.8536 7.14645C14.5386 7.46143 14.7617 8 15.2071 8H17Z"
                fill="black"
              />
            </svg>
          </button>
        </div>
        <div className="my-2 flex items-center justify-between text-sm">
          <span className="font-medium">To Network</span>
          <span className="text-xs">Chain Selector</span>
        </div>
        <div className="mb-6 flex justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400">
          <div className="flex flex-col gap-y-2">
            <span className="text-xs font-normal">You receive</span>
            <div className="flex items-center gap-x-2">
              <button className="cursor-pointer rounded-md bg-gray-200 p-[6px]">
                <svg
                  fill="none"
                  height="12"
                  viewBox="0 0 13 12"
                  width="13"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.60251 3.86954L3.69236 3.868V6.85181C3.69236 7.20464 3.98588 7.49067 4.34796 7.49067C4.71004 7.49067 5.00356 7.20464 5.00356 6.85181V3.86615L6.09341 3.86461C6.45704 3.8641 6.55205 3.65511 6.30406 3.39622L4.6099 1.62755C4.44458 1.45496 4.17654 1.45975 4.02038 1.62839L2.38366 3.3958C2.1409 3.65796 2.2376 3.87006 2.60251 3.86954Z"
                    fill="#17171A"
                  />
                  <path
                    d="M7.41024 8.13046L8.50009 8.132V5.14819C8.50009 4.79536 8.79361 4.50933 9.15569 4.50933C9.51777 4.50933 9.81129 4.79536 9.81129 5.14819V8.13385L10.9011 8.13539C11.2648 8.1359 11.3598 8.34489 11.1118 8.60378L9.41763 10.3724C9.25231 10.545 8.98427 10.5402 8.82811 10.3716L7.19139 8.6042C6.94863 8.34204 7.04533 8.12994 7.41024 8.13046Z"
                    fill="#17171A"
                  />
                </svg>
              </button>
              <span className="text-base font-medium text-neutral-400">
                <span>$</span>
                <span className="ml-1 ">0</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <span className="text-xs">Token selector</span>
            <div className="flex items-center gap-x-2 text-sm font-normal">
              <span>Balance: 5.609</span>
            </div>
          </div>
        </div>
        <button className="h-14 w-full cursor-pointer rounded-xl bg-black text-base text-white">
          Deposit funds
        </button>
      </main>
    </div>
  )
}

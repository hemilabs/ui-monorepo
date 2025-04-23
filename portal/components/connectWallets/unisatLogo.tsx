export const UnisatLogo = () => (
  <svg fill="none" height={14} width={14} xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#unisat_a)">
      <path
        d="M11.667 0H2.333A2.333 2.333 0 0 0 0 2.333v9.334A2.333 2.333 0 0 0 2.333 14h9.334A2.333 2.333 0 0 0 14 11.667V2.333A2.333 2.333 0 0 0 11.667 0Z"
        fill="#12100F"
      />
      <mask
        height={10}
        id="unisat_b"
        maskUnits="userSpaceOnUse"
        style={{
          maskType: 'luminance',
        }}
        width={8}
        x={3}
        y={2}
      >
        <path d="M3.213 2.187h7.583v9.625H3.213V2.187Z" fill="#fff" />
      </mask>
      <g mask="url(#unisat_b)">
        <path
          d="m8.562 3.053 1.985 1.957c.17.166.252.334.25.503a.655.655 0 0 1-.218.464.696.696 0 0 1-.48.225c-.172.002-.342-.08-.511-.246l-2.031-2a2.308 2.308 0 0 0-.667-.484.98.98 0 0 0-.676-.044c-.236.065-.49.23-.762.498-.374.37-.553.716-.535 1.04.019.324.205.66.558 1.007l2.047 2.018c.17.168.254.336.252.503-.003.168-.076.322-.22.465a.703.703 0 0 1-.477.222c-.173.006-.345-.076-.516-.244L4.576 6.981c-.323-.318-.556-.62-.7-.903a1.704 1.704 0 0 1-.16-.964c.034-.307.133-.604.298-.892.164-.288.4-.583.706-.884.364-.36.712-.635 1.044-.826.33-.192.65-.298.96-.32.31-.022.615.039.917.184.302.144.608.37.92.677Z"
          fill="url(#unisat_c)"
        />
        <path
          d="M5.447 10.947 3.463 8.99c-.17-.167-.253-.334-.25-.503a.655.655 0 0 1 .217-.464.696.696 0 0 1 .481-.225c.172-.002.342.08.511.246l2.03 2c.231.228.453.39.668.484.214.094.44.108.676.044.236-.065.49-.23.761-.499.375-.37.554-.716.536-1.04-.019-.324-.205-.66-.558-1.008L7.445 6.96c-.171-.168-.255-.336-.253-.503.003-.168.076-.322.221-.465a.703.703 0 0 1 .476-.222c.173-.006.345.075.516.244l1.028 1.004c.323.318.556.619.7.903.143.284.197.605.16.964a2.278 2.278 0 0 1-.298.892c-.164.288-.4.583-.706.884a5.312 5.312 0 0 1-1.043.826c-.332.191-.652.298-.962.32-.31.023-.615-.039-.917-.183a3.482 3.482 0 0 1-.92-.678Z"
          fill="url(#unisat_d)"
        />
        <path
          d="M6.683 5.897a.727.727 0 0 0 .729-.725c0-.401-.327-.726-.73-.726a.727.727 0 0 0-.728.726c0 .4.326.725.729.725Z"
          fill="url(#unisat_e)"
        />
      </g>
    </g>
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="unisat_c"
        x1={10.221}
        x2={4.078}
        y1={4.193}
        y2={6.937}
      >
        <stop stopColor="#201C1B" />
        <stop offset={0.36} stopColor="#77390D" />
        <stop offset={0.67} stopColor="#EA8101" />
        <stop offset={1} stopColor="#F4B852" />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="unisat_d"
        x1={3.958}
        x2={11.082}
        y1={9.887}
        y2={7.756}
      >
        <stop stopColor="#1F1D1C" />
        <stop offset={0.37} stopColor="#77390D" />
        <stop offset={0.67} stopColor="#EA8101" />
        <stop offset={1} stopColor="#F4FB52" />
      </linearGradient>
      <radialGradient
        cx={0}
        cy={0}
        gradientTransform="matrix(.72905 0 0 .72529 6.683 5.172)"
        gradientUnits="userSpaceOnUse"
        id="unisat_e"
        r={1}
      >
        <stop stopColor="#F4B852" />
        <stop offset={0.33} stopColor="#EA8101" />
        <stop offset={0.64} stopColor="#77390D" />
        <stop offset={1} stopColor="#211C1D" />
      </radialGradient>
      <clipPath id="unisat_a">
        <rect fill="#fff" height={14} rx={7} width={14} />
      </clipPath>
    </defs>
  </svg>
)

# Wk02 - Planck spectrum -> Stefan-Boltzmann (numeric check)
# Run: julia wk02_planck_stefan.jl   (needs Plots)
# Author: Prof. S. Joon Kwon - SPMDL - SKKU
using Plots, Printf

const h = 6.626e-34; const c = 2.998e8
const kB = 1.381e-23; const SB = 5.670e-8

planck(lam, T) = 2pi * h * c^2 / lam^5 / expm1(h * c / (lam * kB * T))

lam = exp10.(range(-7.3, -4.3, length=2000))
plt = plot(xscale=:log10, xlabel="wavelength [um]",
           ylabel="exitance [MW/m^2/um]",
           title="Planck spectra: area = sigma*T^4")
for T in [2000.0, 3000, 4000, 5000, 5778]
    B = planck.(lam, T)
    P_num = sum(0.5 .* (B[1:end-1] .+ B[2:end]) .* diff(lam))  # trapz
    P_sb = SB * T^4
    @printf("T=%5.0f K: num = %.3e, SB = %.3e, ratio = %.4f\n",
            T, P_num, P_sb, P_num / P_sb)
    plot!(plt, lam .* 1e6, B ./ 1e12, lw=2,
          label="T = " * string(Int(T)) * " K")
end
display(plt); readline()

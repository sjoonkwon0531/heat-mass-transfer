# Week 5 - Topic 3: Laminar-Turbulent Transition on a Flat Plate
# Re_crit = 5e5;  <Nu_lam> = 0.664*Pr^(1/3)*Re^(1/2)
# <Nu_turb> = 0.037*Re^0.8*Pr / (1 + 2.443*Re^(-0.1)*(Pr^(2/3)-1))
# blend: <Nu> = sqrt(<Nu_lam>^2 + <Nu_turb>^2)
# Run: julia week5_topic3_turbulent_plate.jl

using Printf

const RE_CRIT = 5.0e5

nu_lam(Re, Pr) = 0.664 * Pr^(1 / 3) * sqrt(Re)
nu_turb(Re, Pr) = 0.037 * Re^0.8 * Pr / (1 + 2.443 * Re^-0.1 * (Pr^(2 / 3) - 1))
nu_combined(Re, Pr) = hypot(nu_lam(Re, Pr), nu_turb(Re, Pr))

Pr = 0.707   # air
println("Flat plate, air (Pr = 0.707):")
println("  Re          Nu_lam     Nu_turb    combined   regime")
for Re in (1e3, 1e4, 1e5, 5e5, 1e6, 5e6, 1e7)
    @printf("  %9.1e  %9.1f  %9.1f  %9.1f   %s\n",
            Re, nu_lam(Re, Pr), nu_turb(Re, Pr), nu_combined(Re, Pr),
            Re < RE_CRIT ? "laminar" : "turbulent")
end
println("  -> the quadrature blend hands over smoothly near Re_crit.")

# --- Worked example: wind over a roof panel ---
nu_air, k_air, L = 15.9e-6, 0.0263, 2.0
@printf("\nWind over an L = %g m panel: mean h vs wind speed\n", L)
println("  U [m/s]   Re_L        x_crit [m]     <Nu>       h [W/m2K]")
for U in (1.0, 2.0, 5.0, 10.0, 20.0)
    ReL = U * L / nu_air
    xc = RE_CRIT * nu_air / U
    Nu = nu_combined(ReL, Pr)
    h = Nu * k_air / L
    xs = xc < L ? @sprintf("%10.2f", xc) : "all laminar"
    @printf("  %6.1f  %10.3e  %11s  %9.1f  %9.2f\n", U, ReL, xs, Nu, h)
end
println("  -> past transition, h grows nearly like U^0.8.")

@assert abs(nu_combined(1e7, Pr) / nu_turb(1e7, Pr) - 1) < 0.02
@assert abs(nu_turb(1e6, 1.0) - 0.037 * 1e6^0.8) < 1e-6

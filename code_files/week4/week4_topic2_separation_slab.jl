# Week 4 - Topic 2: Transient Conduction in a Slab - Separation of Variables
# Y = (T-Ts)/(T0-Ts) = (4/pi) sum_{n odd} (1/n) sin(n*pi*x/L) exp(-(n*pi/2)^2 Fo)
# Fo = alpha*t/(L/2)^2. First term alone = Heisler-chart regime (Fo >= ~0.2).
# Run: julia week4_topic2_separation_slab.jl

using Printf

function slab_series(x_over_L, Fo; nmax=399)
    s = 0.0
    for n in 1:2:nmax
        s += sin(n * pi * x_over_L) / n * exp(-(n * pi / 2)^2 * Fo)
    end
    return 4 / pi * s
end

slab_one_term(x_over_L, Fo) = 4 / pi * sin(pi * x_over_L) * exp(-(pi / 2)^2 * Fo)

println("Centerline history Y_c, x/L = 0.5")
println("  Fo     full series   1-term    rel. error")
for Fo in (0.02, 0.05, 0.1, 0.2, 0.5, 1.0)
    full = slab_series(0.5, Fo)
    one = slab_one_term(0.5, Fo)
    @printf("  %4.2f   %10.6f  %8.6f   %6.3f %%\n", Fo, full, one, abs(one - full) / full * 100)
end
println("  -> beyond Fo ~ 0.2 one term is enough.")

println("\nProfiles Y(x) at Fo = 0.05 / 0.2 / 0.5:")
for Fo in (0.05, 0.2, 0.5)
    prof = join([@sprintf("%5.3f", slab_series(i / 10, Fo)) for i in 0:10], "  ")
    @printf("  Fo=%4.2f: %s\n", Fo, prof)
end

# Worked example: 20 mm steel plate, T0 = 600, surfaces -> 30 degC
L = 0.020
alpha = 45.0 / (7800.0 * 480.0)
T0, Ts = 600.0, 30.0
half = L / 2
println("\nWorked example: 20 mm steel plate, T0 = 600 -> Ts = 30 degC")
for t in (0.5, 1.0, 2.0, 5.0, 10.0)
    Fo = alpha * t / half^2
    Tc = Ts + (T0 - Ts) * slab_series(0.5, Fo)
    @printf("  t = %5.1f s  Fo = %6.3f  T_center = %7.2f degC\n", t, Fo, Tc)
end

# sanity checks: IC and BC
@assert abs(slab_series(0.0, 0.3)) < 1e-12
@assert abs(slab_series(1.0, 0.3)) < 1e-12
y0 = slab_series(0.5, 1e-6; nmax=19999)
@assert abs(y0 - 1.0) < 1e-3
@printf("\nBC check: Y(0)=Y(L)=0 exactly; Y(center, Fo->0) = %.6f\n", y0)

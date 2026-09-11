# Week 3 - Topic 1: 2D Steady-State Heat Conduction (Analytical Fourier Series)
# T(x,y) = (4*T1/pi) * sum_{k=0}^{kmax} exp(-(2k+1)*pi*y/L) * sin((2k+1)*pi*x/L) / (2k+1)
# Run: julia week3_topic1_analytical2d.jl

function temperature(x, y; kmax=30, T1=1.0, L=1.0)
    s = 0.0
    for k in 0:kmax
        n = 2k + 1
        s += exp(-n * pi * y / L) * sin(n * pi * x / L) / n
    end
    return 4T1 / pi * s
end

function heatflux(x, y; kmax=30, T1=1.0, L=1.0, kcond=1.0)
    sx = 0.0; sy = 0.0
    for k in 0:kmax
        n = 2k + 1
        e = exp(-n * pi * y / L)
        sx += (pi / L) * e * cos(n * pi * x / L)
        sy += -(pi / L) * e * sin(n * pi * x / L)
    end
    pref = 4T1 / pi
    return (-kcond * pref * sx, -kcond * pref * sy)
end

println("Convergence at (0.5L, 0.5L):")
for kmax in (0, 5, 10, 20, 30)
    Tc = temperature(0.5, 0.5; kmax=kmax)
    println("  kmax = $kmax  ->  T/T1 = $(round(Tc, digits=8))")
end

println("\nSpot values (kmax = 30):")
println("  T/T1 at (0.25, 0.10) = $(round(temperature(0.25, 0.10), digits=6))")
println("  T/T1 at (0.50, 0.25) = $(round(temperature(0.50, 0.25), digits=6))")

qx, qy = heatflux(0.5, 0.25)
println("  flux/k at (0.50, 0.25): qx = $(round(qx, digits=6)), qy = $(round(qy, digits=6))")

# Full normalized field on a 101x101 grid
xs = range(0.0, 1.0; length=101)
ys = range(0.0, 1.0; length=101)
T = [temperature(x, y) for y in ys, x in xs]
println("\nField summary: T/T1 in [$(round(minimum(T), digits=4)), $(round(maximum(T), digits=4))]")
println("BC check: T(0, 0.5) = $(temperature(0.0, 0.5)), T(0.5, 0) = $(round(temperature(0.5, 0.0), digits=6))")

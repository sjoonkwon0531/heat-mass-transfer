# Week 5 - Topic 1: Blasius Boundary Layer by the Shooting Method
# f*f'' + 2*f''' = 0, f(0) = f'(0) = 0, f'(inf) = 1
# Shooting + secant on f''(0). Results: f''(0) = 0.332057, beta = 1.720787.
# Run: julia week5_topic1_blasius_shooting.jl

using Printf

rhs(y) = (y[2], y[3], -0.5 * y[1] * y[3])

function integrate(fpp0; zmax=10.0, dz=0.001, store=false)
    y = (0.0, 0.0, fpp0)
    path = store ? [(0.0, y...)] : nothing
    n = round(Int, zmax / dz)
    for i in 1:n
        k1 = rhs(y)
        k2 = rhs(ntuple(j -> y[j] + dz / 2 * k1[j], 3))
        k3 = rhs(ntuple(j -> y[j] + dz / 2 * k2[j], 3))
        k4 = rhs(ntuple(j -> y[j] + dz * k3[j], 3))
        y = ntuple(j -> y[j] + dz / 6 * (k1[j] + 2k2[j] + 2k3[j] + k4[j]), 3)
        store && push!(path, (i * dz, y...))
    end
    return y, path
end

function solve_blasius()
    a, b = 0.2, 0.5
    ga = integrate(a)[1][2] - 1
    gb = integrate(b)[1][2] - 1
    for _ in 1:40
        c = b - gb * (b - a) / (gb - ga)
        gc = integrate(c)[1][2] - 1
        a, ga, b, gb = b, gb, c, gc
        abs(gc) < 1e-12 && break
    end
    return b
end

fpp0 = solve_blasius()
@printf("Shooting result: f''(0) = %.6f   (lecture: 0.332057)\n", fpp0)

_, path = integrate(fpp0; store=true)
z99 = first(p[1] for p in path if p[3] >= 0.99)
@printf("f' = 0.99 at zeta = %.2f -> delta_99 ~ 5.0*x/sqrt(Re_x)\n", z99)
zl, fl = path[end][1], path[end][2]
@printf("beta = lim(zeta - f) = %.6f (lecture: 1.720787)\n", zl - fl)

println("\nProfile:")
println("  zeta    f        f'       f''")
for zt in (0.0, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 8.0)
    p = path[round(Int, zt / 0.001) + 1]
    @printf("  %4.1f  %7.4f  %7.4f  %7.4f\n", p[1], p[2], p[3], p[4])
end

@printf("\n2*f''(0) = %.4f (the 0.664 prefactor); C_f = 1.328/sqrt(Re_L)\n", 2fpp0)
nu, U, L = 15.9e-6, 5.0, 0.5
@printf("Air, U = %g m/s, L = %g m -> Re_L = %.3e (laminar)\n", U, L, U * L / nu)
for x in (0.05, 0.1, 0.25, 0.5)
    Rex = U * x / nu
    @printf("  x = %4.2f m: delta_99 = %5.2f mm, c_f = %.5f\n",
            x, 5.0 * x / sqrt(Rex) * 1e3, 0.664 / sqrt(Rex))
end

@assert abs(fpp0 - 0.332057) < 1e-4
@assert abs((zl - fl) - 1.720787) < 1e-4

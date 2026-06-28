package br.com.efcaas.api.tenant;

public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_TENANT_SLUG = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(Long tenantId, String tenantSlug) {
        CURRENT_TENANT_ID.set(tenantId);
        CURRENT_TENANT_SLUG.set(tenantSlug);
    }

    public static void setTenantId(Long tenantId) {
        CURRENT_TENANT_ID.set(tenantId);
    }

    public static Long getTenantId() {
        return CURRENT_TENANT_ID.get();
    }

    public static String getTenantSlug() {
        return CURRENT_TENANT_SLUG.get();
    }

    public static Long requireTenantId() {
        Long id = CURRENT_TENANT_ID.get();
        if (id == null) {
            throw new IllegalStateException("Contexto de tenant não definido");
        }
        return id;
    }

    public static void clear() {
        CURRENT_TENANT_ID.remove();
        CURRENT_TENANT_SLUG.remove();
    }
}

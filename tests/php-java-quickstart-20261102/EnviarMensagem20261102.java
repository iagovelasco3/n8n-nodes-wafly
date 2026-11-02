import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

// Java 11+. Dependência Maven: com.fasterxml.jackson.core:jackson-databind:2.22.4
// Dependências transitivas oficiais: jackson-core 2.22.4, jackson-annotations 2.22.
// Fonte: https://github.com/FasterXML/jackson/wiki/Jackson-Release-2.22.4
// Execute somente no backend com essas dependências no classpath.
// Configure WAFLY_CLIENT_TOKEN, WAFLY_INSTANCE, WAFLY_TOKEN, WAFLY_PHONE e WAFLY_MESSAGE.
// WAFLY_BASE_URL é opcional; HTTP só é aceito em loopback para testes locais.
public final class EnviarMensagem20261102 {
    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    private static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException();
        return value;
    }

    private static String segment(String value) {
        StringBuilder result = new StringBuilder();
        final char[] hex = "0123456789ABCDEF".toCharArray();
        for (byte valueByte : value.getBytes(StandardCharsets.UTF_8)) {
            int b = valueByte & 0xff;
            if ((b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z') || (b >= '0' && b <= '9')
                    || b == '-' || b == '_' || b == '.' || b == '~') result.append((char) b);
            else result.append('%').append(hex[b >>> 4]).append(hex[b & 15]);
        }
        return result.toString();
    }

    public static void main(String[] args) {
        try {
            // Configure antes de criar o primeiro HttpClient deste processo.
            // Num app já iniciado, use também estas propriedades com -D na JVM.
            System.setProperty("jdk.httpclient.disableRetryConnect", "true");
            System.setProperty("jdk.httpclient.enableAllMethodRetry", "false");
            String clientToken = requiredEnv("WAFLY_CLIENT_TOKEN");
            String instance = requiredEnv("WAFLY_INSTANCE");
            String token = requiredEnv("WAFLY_TOKEN");
            String phone = requiredEnv("WAFLY_PHONE");
            String message = requiredEnv("WAFLY_MESSAGE");
            for (String credential : new String[] {clientToken, instance, token}) {
                if (credential.matches("(?s).*[\\x00-\\x1f\\x7f].*")) throw new IllegalArgumentException();
            }
            if (!phone.matches("[0-9]{10,15}")) throw new IllegalArgumentException();
            String configuredBase = System.getenv("WAFLY_BASE_URL");
            String base = (configuredBase == null ? "https://wafly.com.br/api-bridge-whats" : configuredBase).replaceAll("/+$", "");
            URI baseUri = URI.create(base);
            String host = baseUri.getHost();
            boolean loopback = host != null && (host.equalsIgnoreCase("localhost") || host.equals("127.0.0.1") || host.equals("[::1]"));
            if (host == null || baseUri.getRawUserInfo() != null || baseUri.getRawQuery() != null || baseUri.getRawFragment() != null
                    || !("https".equals(baseUri.getScheme()) || ("http".equals(baseUri.getScheme()) && loopback))) {
                throw new IllegalArgumentException();
            }
            URI url = URI.create(base + "/instances/" + segment(instance) + "/token/" + segment(token) + "/send-text");
            ObjectMapper mapper = new ObjectMapper().enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS);
            Map<String, String> payload = new LinkedHashMap<>();
            payload.put("phone", phone);
            payload.put("message", message);
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(TIMEOUT).followRedirects(HttpClient.Redirect.NEVER)
                    .version(HttpClient.Version.HTTP_1_1).build();
            HttpRequest request = HttpRequest.newBuilder(url).timeout(TIMEOUT)
                    .header("Client-Token", clientToken).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload), StandardCharsets.UTF_8)).build();
            // Uma tentativa. Timeout/erro é resultado incerto; não repita automaticamente.
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) throw new IllegalStateException();
            JsonNode data = mapper.readTree(response.body());
            if (data == null || !data.isObject() || data.has("error")
                    || (data.has("value") && (!data.get("value").isBoolean() || !data.get("value").booleanValue()))) {
                throw new IllegalStateException();
            }
            JsonNode id = data.get("messageId");
            if (id == null || !id.isTextual() || id.textValue().isBlank() || id.textValue().startsWith("DUPLICATE_")) {
                throw new IllegalStateException();
            }
            // Guarde o ID da solicitação. Aceite da API não comprova entrega ou leitura.
            System.out.println(mapper.writeValueAsString(Map.of("messageId", id.textValue())));
        } catch (Exception error) {
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            // Nunca imprima a exceção, URL, token ou corpo da requisição/resposta.
            System.err.println("Envio não confirmado pela API. O resultado pode ser incerto; confira antes de repetir.");
            System.exit(1);
        }
    }
}

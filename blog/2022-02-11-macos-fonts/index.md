Redirecting...

<script setup lang="ts">
import { useRouter } from "vitepress"; 

if (typeof window !== "undefined") {
  const { go } = useRouter();
  go(`/blog/2022-02-11-macos-fonts${location.hash}`);
}
</script>

// Scroll stories: each .story section shows its last state without JavaScript.
// With it, the step nearest the middle of the screen sets data-step on the section, and CSS does the rest.
(function () {
  var stories = document.querySelectorAll('.story');
  if (!stories.length || !('IntersectionObserver' in window)) return;
  // On phones the graphic pins to the top half, so a step takes over once its card reaches the lower part of the screen.
  var narrow = window.matchMedia('(max-width: 720px)').matches;
  stories.forEach(function (story) {
    var steps = story.querySelectorAll('.story-step');
    story.setAttribute('data-step', '1');
    story.classList.add('is-live');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        steps.forEach(function (step) { step.classList.toggle('is-active', step === entry.target); });
        story.setAttribute('data-step', entry.target.getAttribute('data-step'));
      });
    }, { rootMargin: narrow ? '-80% 0px -19% 0px' : '-45% 0px -45% 0px' });
    steps.forEach(function (step) { observer.observe(step); });
  });
})();

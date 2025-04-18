document.addEventListener("DOMContentLoaded", function () {
    const countdownElement = document.querySelector(".countdown-offer-wrapper");
    if (!countdownElement) return;
  
    // Parse the end date from the data-end-date attribute
    const endDate = new Date(Date.parse(countdownElement.dataset.endDate));
  
    function updateCountdown() {
      const now = new Date();
      const timeDiff = endDate - now;
  
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
        const seconds = Math.floor((timeDiff / 1000) % 60);
  
        document.getElementById("days").textContent = days;
        document.getElementById("hours").textContent = hours;
        document.getElementById("minutes").textContent = minutes;
        document.getElementById("seconds").textContent = seconds;
      } else {
        document.getElementById("countdown-timer").innerHTML = "<p>Offer Expired</p>";
      }
    }
  
    // Run the countdown function immediately and set an interval to update every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
  });
  